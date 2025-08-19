# S3 Exporter

Prometheus exporter for AWS S3 buckets

## Usage

```bash
git clone https://github.com/AlphaHydrae/s3-exporter.git
cd s3-exporter
docker build -t s3-exporter .
docker run --init -p "3000:3000" --rm s3-exporter
```
