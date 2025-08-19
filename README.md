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

curl -u "$AWS_ACCESS_KEY_ID:$AWS_SECRET_ACCESS_KEY" \
  "http://localhost:3000/metrics?bucket=my-bucket&region=us-east-1"
```

## Configuration

An AWS access key ID and secret access key must be provided using basic
authentication.

> [!TIP]
> If you use the [Prometheus blackbox
> exporter](https://github.com/prometheus/blackbox_exporter), this can be done
> by configuring a
> [module](https://github.com/prometheus/blackbox_exporter/blob/master/CONFIGURATION.md#module).

The following query parameters are used for configuration:

| Parameter | Required | Description                                                     |
| :-------- | :------- | :-------------------------------------------------------------- |
| `bucket`  | **yes**  | Name of the AWS S3 bucket to collect metrics for                |
| `region`  | **yes**  | AWS region where the bucket is located                          |
| `prefix`  | _no_     | Prefix to collect metrics for (may be specified multiple times) |

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
