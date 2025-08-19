/* eslint-disable max-lines */
import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { F } from '@mobily/ts-belt';

import { MetricsCollector, S3 } from '../src';
import { OpenMetricsMetric } from '../src/metrics/open-metrics';

describe('metrics collector', () => {
  // eslint-disable-next-line jest/no-hooks
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('collect no metrics', async () => {
    expect.hasAssertions();

    const s3Mock = {
      getRegion: F.always('us-east-1'),
      listAllObjects: jest
        .fn<typeof S3.prototype.listAllObjects>()
        .mockResolvedValue([[], 1]),
      listAllObjectVersions: jest
        .fn<typeof S3.prototype.listAllObjectVersions>()
        .mockResolvedValue([[], 1])
    } as unknown as S3;

    const collector = new MetricsCollector(undefined, s3Mock);

    jest.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1024);

    const result = await collector.collectMetrics('foo');

    expect(result).toStrictEqual([
      successMetric(1, { bucket: 'foo', region: 'us-east-1' }),
      queriesMetric(2, { bucket: 'foo', region: 'us-east-1' }),
      objectsCountMetric(0, { bucket: 'foo', region: 'us-east-1', prefix: '' }),
      objectVersionsCountMetric(0, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      objectsSizeSumMetric(0, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      objectVersionsSizeSumMetric(0, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      largestObjectSizeMetric(-1, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      largestObjectVersionSizeMetric(-1, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      oldestObjectLastModifiedDateMetric(-1, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      oldestObjectSize(-1, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      oldestObjectVersionLastModifiedDateMetric(-1, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      oldestObjectVersionSize(-1, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      newestObjectLastModifiedDateMetric(-1, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      newestObjectSize(-1, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      newestObjectVersionLastModifiedDateMetric(-1, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      newestObjectVersionSize(-1, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      durationMetric(0.024, {
        bucket: 'foo',
        region: 'us-east-1'
      })
    ]);
  });

  test('collect basic metrics', async () => {
    expect.hasAssertions();

    const s3Mock = {
      getRegion: F.always('us-east-1'),
      listAllObjects: jest
        .fn<typeof S3.prototype.listAllObjects>()
        .mockResolvedValue([
          [
            {
              key: 'file01',
              size: 100,
              lastModified: new Date(1_736_530_200_000)
            },
            {
              key: 'dir1/file11',
              size: 50,
              lastModified: new Date(1_741_627_800_000)
            },
            {
              key: 'dir1/file12',
              size: 125,
              lastModified: new Date(1_746_894_600_000)
            }
          ],
          1
        ]),
      listAllObjectVersions: jest
        .fn<typeof S3.prototype.listAllObjectVersions>()
        .mockResolvedValue([[], 1])
    } as unknown as S3;

    const collector = new MetricsCollector(undefined, s3Mock);

    jest.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1024);

    const result = await collector.collectMetrics('foo');

    expect(result).toStrictEqual([
      successMetric(1, { bucket: 'foo', region: 'us-east-1' }),
      queriesMetric(2, { bucket: 'foo', region: 'us-east-1' }),
      objectsCountMetric(3, { bucket: 'foo', region: 'us-east-1', prefix: '' }),
      objectVersionsCountMetric(0, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      objectsSizeSumMetric(275, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      objectVersionsSizeSumMetric(0, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      largestObjectSizeMetric(125, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      largestObjectVersionSizeMetric(-1, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      oldestObjectLastModifiedDateMetric(1_736_530_200, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      oldestObjectSize(100, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      oldestObjectVersionLastModifiedDateMetric(-1, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      oldestObjectVersionSize(-1, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      newestObjectLastModifiedDateMetric(1_746_894_600, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      newestObjectSize(125, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      newestObjectVersionLastModifiedDateMetric(-1, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      newestObjectVersionSize(-1, {
        bucket: 'foo',
        region: 'us-east-1',
        prefix: ''
      }),
      durationMetric(0.024, {
        bucket: 'foo',
        region: 'us-east-1'
      })
    ]);
  });
});

function successMetric(
  value: number,
  labels: Record<string, string>
): OpenMetricsMetric {
  return {
    help: 'Whether the S3 exporter was able to collect metrics successfully',
    name: 's3_success',
    type: 'gauge',
    values: [
      {
        value,
        labels
      }
    ]
  };
}

function queriesMetric(
  value: number,
  labels: Record<string, string>
): OpenMetricsMetric {
  return {
    help: 'The number of queries made to S3 to collect metrics',
    name: 's3_queries',
    type: 'gauge',
    values: [
      {
        value,
        labels
      }
    ]
  };
}

function objectsCountMetric(
  value: number,
  labels: Record<string, string>
): OpenMetricsMetric {
  return {
    help: 'The number of objects for the bucket/prefix combination',
    name: 's3_objects_count',
    type: 'gauge',
    values: [
      {
        value,
        labels
      }
    ]
  };
}

function objectVersionsCountMetric(
  value: number,
  labels: Record<string, string>
): OpenMetricsMetric {
  return {
    help: 'The number of object versions for the bucket/prefix combination',
    name: 's3_object_versions_count',
    type: 'gauge',
    values: [
      {
        value,
        labels
      }
    ]
  };
}

function objectsSizeSumMetric(
  value: number,
  labels: Record<string, string>
): OpenMetricsMetric {
  return {
    help: 'The sum of the size of all objects for the bucket/prefix combination',
    name: 's3_objects_size_sum_bytes',
    type: 'gauge',
    unit: 'bytes',
    values: [
      {
        value,
        labels
      }
    ]
  };
}

function objectVersionsSizeSumMetric(
  value: number,
  labels: Record<string, string>
): OpenMetricsMetric {
  return {
    help: 'The sum of the size of all object versions for the bucket/prefix combination',
    name: 's3_object_versions_size_sum_bytes',
    type: 'gauge',
    unit: 'bytes',
    values: [
      {
        value,
        labels
      }
    ]
  };
}

function largestObjectSizeMetric(
  value: number,
  labels: Record<string, string>
): OpenMetricsMetric {
  return {
    help: 'The size of the largest object for the bucket/prefix combination',
    name: 's3_largest_object_size_bytes',
    type: 'gauge',
    unit: 'bytes',
    values: [
      {
        value,
        labels
      }
    ]
  };
}

function largestObjectVersionSizeMetric(
  value: number,
  labels: Record<string, string>
): OpenMetricsMetric {
  return {
    help: 'The size of the largest object version for the bucket/prefix combination',
    name: 's3_largest_object_version_size_bytes',
    type: 'gauge',
    unit: 'bytes',
    values: [
      {
        value,
        labels
      }
    ]
  };
}

function oldestObjectLastModifiedDateMetric(
  value: number,
  labels: Record<string, string>
): OpenMetricsMetric {
  return {
    help: 'The last modification time of the oldest object, in seconds since the epoch',
    name: 's3_oldest_object_last_modified_date_seconds',
    type: 'gauge',
    unit: 'seconds',
    values: [
      {
        value,
        labels
      }
    ]
  };
}

function oldestObjectSize(
  value: number,
  labels: Record<string, string>
): OpenMetricsMetric {
  return {
    help: 'The byte size of the oldest object',
    name: 's3_oldest_object_size_bytes',
    type: 'gauge',
    unit: 'bytes',
    values: [
      {
        value,
        labels
      }
    ]
  };
}

function oldestObjectVersionLastModifiedDateMetric(
  value: number,
  labels: Record<string, string>
): OpenMetricsMetric {
  return {
    help: 'The last modification time of the oldest object version, in seconds since the epoch',
    name: 's3_oldest_object_version_last_modified_date_seconds',
    type: 'gauge',
    unit: 'seconds',
    values: [
      {
        value,
        labels
      }
    ]
  };
}

function oldestObjectVersionSize(
  value: number,
  labels: Record<string, string>
): OpenMetricsMetric {
  return {
    help: 'The byte size of the oldest object version',
    name: 's3_oldest_object_version_size_bytes',
    type: 'gauge',
    unit: 'bytes',
    values: [
      {
        value,
        labels
      }
    ]
  };
}

function newestObjectLastModifiedDateMetric(
  value: number,
  labels: Record<string, string>
): OpenMetricsMetric {
  return {
    help: 'The last modification time of the newest object, in seconds since the epoch',
    name: 's3_newest_object_last_modified_date_seconds',
    type: 'gauge',
    unit: 'seconds',
    values: [
      {
        value,
        labels
      }
    ]
  };
}

function newestObjectSize(
  value: number,
  labels: Record<string, string>
): OpenMetricsMetric {
  return {
    help: 'The byte size of the newest object',
    name: 's3_newest_object_size_bytes',
    type: 'gauge',
    unit: 'bytes',
    values: [
      {
        value,
        labels
      }
    ]
  };
}

function newestObjectVersionLastModifiedDateMetric(
  value: number,
  labels: Record<string, string>
): OpenMetricsMetric {
  return {
    help: 'The last modification time of the newest object version, in seconds since the epoch',
    name: 's3_newest_object_version_last_modified_date_seconds',
    type: 'gauge',
    unit: 'seconds',
    values: [
      {
        value,
        labels
      }
    ]
  };
}

function newestObjectVersionSize(
  value: number,
  labels: Record<string, string>
): OpenMetricsMetric {
  return {
    help: 'The byte size of the newest object version',
    name: 's3_newest_object_version_size_bytes',
    type: 'gauge',
    unit: 'bytes',
    values: [
      {
        value,
        labels
      }
    ]
  };
}

function durationMetric(
  value: number,
  labels: Record<string, string>
): OpenMetricsMetric {
  return {
    help: 'How many seconds it took the S3 exporter to collect metrics',
    name: 's3_duration_seconds',
    type: 'gauge',
    unit: 'seconds',
    values: [
      {
        value,
        labels
      }
    ]
  };
}
