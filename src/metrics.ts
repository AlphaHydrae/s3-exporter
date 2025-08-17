/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/naming-convention */
import {
  _Object,
  ListObjectsV2Command,
  ListObjectVersionsCommand,
  ObjectVersion,
  S3Client
} from '@aws-sdk/client-s3';
import { A, N, O, pipe } from '@mobily/ts-belt';

import { getLogger } from './logging.js';
import { OpenMetricsMetric } from './open-metrics.js';

const logger = getLogger('metrics');

export type S3ExporterParams = {
  readonly bucket: string;
  readonly region: string;
  readonly prefixes: readonly string[];
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
};

// eslint-disable-next-line max-lines-per-function
export async function collectPrometheusMetrics({
  bucket,
  region,
  prefixes,
  accessKeyId,
  secretAccessKey
}: S3ExporterParams): Promise<readonly OpenMetricsMetric[]> {
  const start = Date.now();

  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });

  const baseLabels = {
    bucket,
    region
  };

  // Create an Amazon S3 bucket. The epoch timestamp is appended
  // to the name to make it unique.
  const [success, [[objects, objectQueries], [versions, versionQueries]]] =
    await listAllObjectsAndVersions(s3Client, bucket);

  const result: readonly OpenMetricsMetric[] = [
    createSuccessMetric(success, baseLabels),
    createQueriesMetric(objectQueries + versionQueries, baseLabels),
    ...calculateMetricsFor(objects, versions, { ...baseLabels, prefix: '' }),
    ...prefixes.flatMap(prefix =>
      calculateMetricsFor(
        objects.filter(obj => obj.Key?.startsWith(prefix) ?? false),
        versions.filter(vsn => vsn.Key?.startsWith(prefix) ?? false),
        { ...baseLabels, prefix }
      )
    )
  ];

  const uniqueMetricNames = pipe(
    result,
    A.map(metric => metric.name),
    A.uniq
  );

  const mergedResult = uniqueMetricNames.flatMap(name => {
    const [firstMetric, ...otherMetrics] = result.filter(
      metric => metric.name === name
    );
    if (firstMetric === undefined) {
      return [];
    }

    return otherMetrics.reduce(
      (acc, metric) => ({
        ...metric,
        values: [...acc.values, ...metric.values]
      }),
      firstMetric
    );
  });

  return [...mergedResult, createDurationMetric(start, baseLabels)];
}

function createSuccessMetric(
  success: boolean,
  labels: Readonly<Record<string, string>>
): OpenMetricsMetric {
  return {
    type: 'gauge',
    name: 's3_success',
    help: 'Whether the S3 exporter was able to collect metrics successfully',
    values: [
      {
        labels,
        value: success ? 1 : 0
      }
    ]
  };
}

function createQueriesMetric(
  queries: number,
  labels: Readonly<Record<string, string>>
): OpenMetricsMetric {
  return {
    type: 'gauge',
    name: 's3_queries',
    help: 'The number of queries made to S3 to collect metrics',
    values: [
      {
        labels,
        value: queries
      }
    ]
  };
}

function createDurationMetric(
  start: number,
  labels: Readonly<Record<string, string>>
): OpenMetricsMetric {
  const timeInSeconds = (Date.now() - start) / 1000;
  return {
    type: 'gauge',
    name: 's3_duration_seconds',
    unit: 'seconds',
    help: 'How many seconds it took the S3 exporter to collect metrics',
    values: [
      {
        labels,
        value: timeInSeconds
      }
    ]
  };
}

async function listAllObjectsAndVersions(
  client: S3Client,
  bucket: string
): Promise<
  [
    boolean,
    [
      readonly [readonly _Object[], number],
      readonly [readonly ObjectVersion[], number]
    ]
  ]
> {
  try {
    return [
      true,
      await Promise.all([
        listAllObjects(client, bucket),
        listAllObjectVersions(client, bucket)
      ])
    ];
  } catch (err) {
    logger.error(
      `Failed to list objects and/or versions in bucket ${bucket}`,
      err
    );
    return [
      false,
      [
        [[], 0],
        [[], 0]
      ]
    ];
  }
}

function calculateMetricsFor(
  objects: readonly _Object[],
  objectVersions: readonly ObjectVersion[],
  labels: Readonly<Record<string, string>>
): readonly OpenMetricsMetric[] {
  const [oldestObject, newestObject] = determineOldestAndNewest(objects);
  const [oldestObjectVersion, newestObjectVersion] =
    determineOldestAndNewest(objectVersions);

  return [
    createS3CountMetric(objects, 'objects', 'objects', labels),
    createS3CountMetric(
      objectVersions,
      'object_versions',
      'object versions',
      labels
    ),
    createTotalSizeMetric(objects, 'objects', 'objects', labels),
    createTotalSizeMetric(
      objectVersions,
      'object_versions',
      'object versions',
      labels
    ),
    createLargestSizeMetric(objects, 'object', 'object', labels),
    createLargestSizeMetric(
      objectVersions,
      'object_version',
      'object version',
      labels
    ),
    ...createOldestMetrics(oldestObject, 'object', 'object', labels),
    ...createOldestMetrics(
      oldestObjectVersion,
      'object_version',
      'object version',
      labels
    ),
    ...createNewestMetrics(newestObject, 'object', 'object', labels),
    ...createNewestMetrics(
      newestObjectVersion,
      'object_version',
      'object version',
      labels
    )
  ];
}

function determineOldestAndNewest<T extends { readonly LastModified?: Date }>(
  values: readonly T[]
): [T | undefined, T | undefined] {
  const init: [T | undefined, T | undefined] = [undefined, undefined];

  return values.reduce(
    ([oldest, newest], current) => [
      oldest === undefined ||
      (current.LastModified !== undefined &&
        (oldest.LastModified === undefined ||
          current.LastModified < oldest.LastModified))
        ? current
        : oldest,
      newest === undefined ||
      (current.LastModified !== undefined &&
        (newest.LastModified === undefined ||
          current.LastModified > newest.LastModified))
        ? current
        : newest
    ],
    init
  );
}

function createLargestSizeMetric(
  values: readonly { Size?: number }[],
  what: string,
  whatHuman: string,
  labels: Readonly<Record<string, string>>
): OpenMetricsMetric {
  const largestObject = values.reduce<{ Size?: number } | undefined>(
    (largest, current) =>
      largest === undefined ||
      (current.Size !== undefined &&
        (largest.Size === undefined || current.Size > largest.Size))
        ? current
        : largest,
    undefined
  );

  return {
    type: 'gauge',
    name: `s3_largest_${what}_size_bytes`,
    unit: 'bytes',
    help: `The size of the largest ${whatHuman} for the bucket/prefix combination`,
    values: [
      {
        labels,
        value: largestObject?.Size ?? -1
      }
    ]
  };
}

function createTotalSizeMetric(
  values: readonly { Size?: number }[],
  what: string,
  whatHuman: string,
  labels: Readonly<Record<string, string>>
): OpenMetricsMetric {
  const totalSize = values.reduce((sum, obj) => sum + (obj.Size ?? 0), 0);
  return {
    type: 'gauge',
    name: `s3_${what}_size_sum_bytes`,
    unit: 'bytes',
    help: `The sum of the size of all ${whatHuman} for the bucket/prefix combination`,
    values: [
      {
        labels,
        value: totalSize
      }
    ]
  };
}

function createS3CountMetric(
  values: readonly unknown[],
  what: string,
  whatHuman: string,
  labels: Readonly<Record<string, string>>
): OpenMetricsMetric {
  return {
    type: 'gauge',
    name: `s3_${what}_count`,
    help: `The number of ${whatHuman} for the bucket/prefix combination`,
    values: [
      {
        labels,
        value: values.length
      }
    ]
  };
}

function createOldestMetrics(
  oldest: { readonly LastModified?: Date; readonly Size?: number } | undefined,
  what: string,
  whatHuman: string,
  labels: Readonly<Record<string, string>>
): readonly OpenMetricsMetric[] {
  return [
    {
      type: 'gauge',
      name: `s3_oldest_${what}_last_modified_date`,
      unit: 'seconds',
      help: `The last modification time of the oldest ${whatHuman}, in seconds since the epoch`,
      values: [
        {
          labels,
          value: pipe(
            O.fromNullable(oldest?.LastModified?.getTime()),
            O.map(N.divide(1000)),
            O.getWithDefault(-1)
          )
        }
      ]
    },
    {
      type: 'gauge',
      name: `s3_oldest_${what}_size_bytes`,
      unit: 'bytes',
      help: `The byte size of the oldest ${whatHuman}`,
      values: [{ labels, value: oldest?.Size ?? -1 }]
    }
  ];
}

function createNewestMetrics(
  newest: { readonly LastModified?: Date; readonly Size?: number } | undefined,
  what: string,
  whatHuman: string,
  labels: Readonly<Record<string, string>>
): readonly OpenMetricsMetric[] {
  return [
    {
      type: 'gauge',
      name: `s3_newest_${what}_last_modified_date`,
      unit: 'seconds',
      help: `The last modification time of the newest ${whatHuman}, in seconds since the epoch`,
      values: [
        {
          labels,
          value: pipe(
            O.fromNullable(newest?.LastModified?.getTime()),
            O.map(N.divide(1000)),
            O.getWithDefault(-1)
          )
        }
      ]
    },
    {
      type: 'gauge',
      name: `s3_newest_${what}_size_bytes`,
      unit: 'seconds',
      help: `The byte size of the newest ${whatHuman}`,
      values: [
        {
          labels,
          value: newest?.Size ?? -1
        }
      ]
    }
  ];
}

async function listAllObjects(
  client: S3Client,
  bucket: string,
  objectsSoFar: readonly _Object[] = [],
  continuationToken?: string,
  requestsSoFar = 0
): Promise<readonly [readonly _Object[], number]> {
  const { Contents, NextContinuationToken: nextContinuationToken } =
    await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken
      })
    );

  const objects = [...objectsSoFar, ...(Contents ?? [])];
  return nextContinuationToken === undefined
    ? [objects, requestsSoFar + 1]
    : listAllObjects(
        client,
        bucket,
        objects,
        nextContinuationToken,
        requestsSoFar + 1
      );
}

// eslint-disable-next-line max-params
async function listAllObjectVersions(
  client: S3Client,
  bucket: string,
  versionsSoFar: readonly ObjectVersion[] = [],
  keyMarker?: string,
  versionIdMarker?: string,
  requestsSoFar = 0
): Promise<readonly [readonly ObjectVersion[], number]> {
  const {
    Versions: newVersions,
    NextKeyMarker: nextKeyMarker,
    NextVersionIdMarker: nextVersionIdMarker
  } = await client.send(
    new ListObjectVersionsCommand({
      Bucket: bucket,
      KeyMarker: keyMarker,
      VersionIdMarker: versionIdMarker
    })
  );

  const versions = [...versionsSoFar, ...(newVersions ?? [])];
  return nextKeyMarker === undefined && nextVersionIdMarker === undefined
    ? [versions, requestsSoFar + 1]
    : listAllObjectVersions(
        client,
        bucket,
        versions,
        nextKeyMarker,
        nextVersionIdMarker,
        requestsSoFar + 1
      );
}
