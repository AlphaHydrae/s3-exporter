import { A, G, O, pipe } from '@mobily/ts-belt';
import express, { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import log4js from 'log4js';

import { version } from '../constants.js';
import { LoggerFactory } from '../logging.js';
import { MetricsCollectorFactory } from '../metrics/metrics-collector.js';
import { serializeOpenMetricsMetric } from '../metrics/open-metrics.js';
import { emptyArray } from '../utils.js';

export type ServerOptions = {
  readonly metricsCollectorFactory: MetricsCollectorFactory;
  readonly baseUrl?: URL;
  readonly port: number;
  readonly loggerFactory?: LoggerFactory;
};

type GetMetricsParams = {
  readonly region: string;
  readonly bucket: string;
  readonly prefixes: readonly string[];
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
};

export class Server {
  readonly metricsCollectorFactory: MetricsCollectorFactory;
  readonly baseUrl: URL;
  readonly port: number;

  readonly #logger: log4js.Logger | undefined;
  readonly #loggerFactory?: LoggerFactory;

  constructor({
    metricsCollectorFactory,
    baseUrl,
    port,
    loggerFactory
  }: ServerOptions) {
    this.metricsCollectorFactory = metricsCollectorFactory;
    this.baseUrl = baseUrl ?? new URL(`http://localhost:${port}`);
    this.port = port;
    this.#logger = pipe(
      O.fromNullable(loggerFactory),
      O.map(factory => factory('server')),
      O.toUndefined
    );
    this.#loggerFactory = loggerFactory;
  }

  start(): Promise<void> {
    const server = express();
    server.disable('x-powered-by');

    const metricsUrl = new URL('metrics', this.baseUrl);

    server.get('/', getRoot(metricsUrl));

    server.get('/metrics', (req, res) => this.#getMetrics(req, res));

    server.use(
      (err: unknown, req: Request, res: Response, _next: NextFunction) => {
        this.#handleError(err, req, res);
      }
    );

    return new Promise((resolve, reject) => {
      server.listen(this.port, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }

        this.#logger?.info(`Server is listening on port ${this.port}`);
      });
    });
  }

  async #getMetrics(req: Request, res: Response): Promise<void> {
    const params = parseParameters(req);
    const collector = this.metricsCollectorFactory({
      ...params,
      loggerFactory: this.#loggerFactory
    });

    const result = await collector.collectMetrics(
      params.bucket,
      params.prefixes
    );
    res
      .set(
        'Content-Type',
        'application/openmetrics-text; version=1.0.0; charset=utf-8'
      )
      .send(pipe(result, A.map(serializeOpenMetricsMetric), A.join('\n\n')));
  }

  #handleError(err: unknown, _req: Request, res: Response): void {
    if (G.isError(err)) {
      const status =
        'status' in err && G.isNumber(err.status) ? err.status : 500;
      const message =
        'expose' in err && G.isBoolean(err.expose) && err.expose
          ? err.message
          : 'An unexpected error occurred';

      res.status(status).send(message);
    } else {
      this.#logger?.warn('An unexpected error occurred', err);
      res.sendStatus(500);
    }
  }
}

function getRoot(metricsUrl: URL): (req: Request, res: Response) => void {
  return (_req: Request, res: Response) =>
    res.send({
      title: 'S3 Exporter',
      version,
      metricsUrl: metricsUrl.toString()
    });
}

function parseParameters(req: Request): GetMetricsParams {
  const bucket = parseBucket(req);
  const region = parseRegion(req);
  const prefixes = parsePrefixes(req);
  const credentials = parseCredentials(req);

  return { bucket, region, prefixes, ...credentials };
}

function parseBucket({ query }: Request): string {
  const { bucket } = query;
  if (!G.isString(bucket)) {
    throw new createHttpError.BadRequest(
      'Missing or invalid "bucket" query parameter'
    );
  }

  return bucket;
}

function parseRegion({ query }: Request): string {
  const { region } = query;
  if (!G.isString(region)) {
    throw new createHttpError.BadRequest(
      'Missing or invalid "region" query parameter'
    );
  }

  return region;
}

function parsePrefixes({ query }: Request): readonly string[] {
  const prefixes = emptyArray<string>();
  const { prefix } = query;
  if (G.isString(prefix)) {
    prefixes.push(prefix);
  } else if (Array.isArray(prefix)) {
    prefixes.push(...prefix.filter(G.isString));
  } else if (prefix !== undefined) {
    throw new createHttpError.BadRequest('Invalid "prefix" query parameter');
  }

  return prefixes;
}

function parseCredentials(req: Request): {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
} {
  const basicAuth = req.headers.authorization;
  if (!basicAuth?.startsWith('Basic ')) {
    throw new createHttpError.Unauthorized(
      'Missing or invalid "Authorization" header'
    );
  }

  const credentials = Buffer.from(basicAuth.slice(6), 'base64').toString(
    'utf8'
  );
  const [accessKeyId, secretAccessKey] = credentials.split(':', 2);
  if (!accessKeyId || !secretAccessKey) {
    throw new createHttpError.Unauthorized(
      'Invalid "Authorization" header format'
    );
  }

  return { accessKeyId, secretAccessKey };
}
