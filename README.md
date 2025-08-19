# S3 Exporter

Prometheus exporter for AWS S3 buckets

[![build](https://github.com/AlphaHydrae/s3-exporter/actions/workflows/build.yml/badge.svg)](https://github.com/AlphaHydrae/s3-exporter/actions/workflows/build.yml)
[![MIT License](https://img.shields.io/static/v1?label=license&message=MIT&color=informational)](https://opensource.org/licenses/MIT)

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

export AWS_ACCESS_KEY_ID=changeme
export AWS_SECRET_ACCESS_KEY=changeme

curl -u "$AWS_ACCESS_KEY_ID:$AWS_SECRET_ACCESS_KEY" \
  "http://localhost:3000/metrics?bucket=my-bucket&region=us-east-1"
```

## Configuration

An AWS access key ID and secret access key must be provided using basic
authentication.

The following query parameters are used to configure the produced metrics:

| Parameter | Required | Description                                                     |
| :-------- | :------- | :-------------------------------------------------------------- |
| `bucket`  | **yes**  | Name of the AWS S3 bucket to collect metrics for                |
| `region`  | **yes**  | AWS region where the bucket is located                          |
| `prefix`  | _no_     | Prefix to collect metrics for (may be specified multiple times) |

The following options can be used to configure the exporter's server:

| Command line option | Environment variables  | Default value           | Description                                                                   |
| :------------------ | :--------------------- | :---------------------- | :---------------------------------------------------------------------------- |
| `--base-url`, `-u`  | `S3_EXPORTER_BASE_URL` | `http://localhost:3000` | The base URL of the exporter (defaults to localhost with the configured port) |
| `--port`, `-p`      | `S3_EXPORTER_PORT`     | `3000`                  | The port on which the exporter's server listens on                            |

## Metrics

These are the metrics returned for a bucket:

| Metric                                        | Type    | Unit      | Number of values | Description                                                                         |
| :-------------------------------------------- | :------ | :-------- | :--------------- | :---------------------------------------------------------------------------------- |
| `s3_success`                                  | `gauge` | -         | `1`              | Whether the S3 exporter was able to collect metrics successfully                    |
| `s3_queries`                                  | `gauge` | -         | `1`              | The number of queries made to S3 to collect metrics                                 |
| `s3_objects_count`                            | `gauge` | -         | `p + 1`          | The number of objects for the bucket/prefix combination                             |
| `s3_object_versions_count`                    | `gauge` | -         | `p + 1`          | The number of object versions for the bucket/prefix combination                     |
| `s3_objects_size_sum_bytes`                   | `gauge` | `bytes`   | `p + 1`          | The sum of the size of all objects for the bucket/prefix combination                |
| `s3_object_versions_size_sum_bytes`           | `gauge` | `bytes`   | `p + 1`          | The sum of the size of all object versions for the bucket/prefix combination        |
| `s3_largest_object_size_bytes`                | `gauge` | `bytes`   | `p + 1`          | The size of the largest object for the bucket/prefix combination                    |
| `s3_largest_object_version_size_bytes`        | `gauge` | `bytes`   | `p + 1`          | The size of the largest object version for the bucket/prefix combination            |
| `s3_oldest_object_last_modified_date`         | `gauge` | -         | `p + 1`          | The last modification time of the oldest object, in seconds since the epoch         |
| `s3_oldest_object_size_bytes`                 | `gauge` | `bytes`   | `p + 1`          | The byte size of the oldest object                                                  |
| `s3_oldest_object_version_last_modified_date` | `gauge` | -         | `p + 1`          | The last modification time of the oldest object version, in seconds since the epoch |
| `s3_oldest_object_version_size_bytes`         | `gauge` | `bytes`   | `p + 1`          | The byte size of the oldest object version                                          |
| `s3_newest_object_last_modified_date`         | `gauge` | -         | `p + 1`          | The last modification time of the newest object, in seconds since the epoch         |
| `s3_newest_object_size_bytes`                 | `gauge` | `bytes`   | `p + 1`          | The byte size of the newest object                                                  |
| `s3_newest_object_version_last_modified_date` | `gauge` | -         | `p + 1`          | The last modification time of the newest object version, in seconds since the epoch |
| `s3_newest_object_version_size_bytes`         | `gauge` | `bytes`   | `p + 1`          | The byte size of the newest object version                                          |
| `s3_duration_seconds`                         | `gauge` | `seconds` | `1`              | How many seconds it took the S3 exporter to collect metrics                         |

> [!TIP]
> `p` stands for the number of prefixes specified in the request. For metrics
> that are prefix-dependent, there will be one value for each prefix plus one
> value for the entirety of the bucket.
