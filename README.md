# S3 Exporter

Prometheus exporter for AWS S3 buckets

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Usage](#usage)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usage

```bash
git clone https://github.com/AlphaHydrae/s3-exporter.git
cd s3-exporter
docker build -t s3-exporter .

docker run --init -p "3000:3000" --rm s3-exporter

curl -u "$AWS_ACCESS_KEY_ID:$AWS_SECRET_ACCESS_KEY" "http://localhost:3000/metrics?bucket=my-bucket&region=us-east-1"
```
