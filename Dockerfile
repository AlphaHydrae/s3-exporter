FROM node:24.5.0-alpine AS builder

WORKDIR /build

COPY ./package.json ./package-lock.json ./
RUN npm ci

COPY ./ ./
RUN npm run build && \
    npm prune --production

RUN mkdir -p /usr/src/app && \
    mv ./bin ./dist ./node_modules ./package.json ./package-lock.json /usr/src/app/

FROM node:24.5.0-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/ ./

RUN addgroup -S s3-exporter && \
    adduser -D -G s3-exporter -H -S -s /sbin/nologin s3-exporter && \
    mkdir /var/lib/app && \
    chown -R s3-exporter:s3-exporter /usr/src/app /var/lib/app && \
    chmod 700 /var/lib/app

CMD ["/usr/src/app/bin/s3-exporter"]
