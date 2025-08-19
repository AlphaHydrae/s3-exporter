/* eslint-disable max-lines */
import { A, N, O, pipe } from '@mobily/ts-belt';
import log4js from 'log4js';

import { LoggerFactory } from '../logging.js';
import { OpenMetricsMetric } from './open-metrics.js';
import { S3, S3Factory, S3ObjectMetadata, S3Options } from './s3.js';
import { Factory } from '../types.js';

export type MetricsCollectorFactory = Factory<
  MetricsCollectorFlatOptions,
  MetricsCollector
>;

export type MetricsCollectorFlatOptions = S3Options & {
  readonly region: string;
  readonly loggerFactory?: LoggerFactory;
};

export type MetricsCollectorFactoryOptions = {
  readonly s3Factory: S3Factory;
};

export type MetricsCollectorOptions = {
  readonly region: string;
  readonly s3: S3;
  readonly loggerFactory?: LoggerFactory;
};

export class MetricsCollector {
  static factory(
    this: void,
    factoryOptions: MetricsCollectorFactoryOptions
  ): MetricsCollectorFactory {
    return options => {
      const s3 = factoryOptions.s3Factory(options);
      return MetricsCollector.create({
        region: options.region,
        s3,
        loggerFactory: options.loggerFactory
      });
    };
  }

  static create(
    this: void,
    options: MetricsCollectorOptions
  ): MetricsCollector {
    return new MetricsCollector(options.loggerFactory, options.s3);
  }

  readonly #logger: log4js.Logger | undefined;

  constructor(
    loggerFactory: LoggerFactory | undefined,
    private readonly s3: S3
  ) {
    this.#logger = pipe(
      O.fromNullable(loggerFactory),
      O.map(factory => factory('metrics')),
      O.toUndefined
    );
  }

  // eslint-disable-next-line max-lines-per-function
  async collectMetrics(
    bucket: string,
    prefixes: readonly string[] = []
  ): Promise<readonly OpenMetricsMetric[]> {
    this.#logger?.info(
      `Collecting metrics for bucket "${bucket}" in region "${this.s3.getRegion()}" with ${prefixes.length} prefixe(s)`
    );
    const start = Date.now();

    const baseLabels = {
      bucket,
      region: this.s3.getRegion()
    };

    // Create an Amazon S3 bucket. The epoch timestamp is appended
    // to the name to make it unique.
    const [success, [[objects, objectQueries], [versions, versionQueries]]] =
      await this.#listAllObjectsAndVersions(bucket);

    const result: readonly OpenMetricsMetric[] = [
      createSuccessMetric(success, baseLabels),
      createQueriesMetric(objectQueries + versionQueries, baseLabels),
      ...calculateMetricsFor(objects, versions, { ...baseLabels, prefix: '' }),
      ...prefixes.flatMap(prefix =>
        calculateMetricsFor(
          objects.filter(obj => obj.key?.startsWith(prefix) ?? false),
          versions.filter(vsn => vsn.key?.startsWith(prefix) ?? false),
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

    this.#logger?.info(`Done collecting metrics in ${Date.now() - start}ms`);

    return [...mergedResult, createDurationMetric(start, baseLabels)];
  }

  async #listAllObjectsAndVersions(
    bucket: string
  ): Promise<
    [
      boolean,
      [
        readonly [readonly S3ObjectMetadata[], number],
        readonly [readonly S3ObjectMetadata[], number]
      ]
    ]
  > {
    try {
      return [
        true,
        await Promise.all([
          this.s3.listAllObjects(bucket),
          this.s3.listAllObjectVersions(bucket)
        ])
      ];
    } catch (err) {
      this.#logger?.error(
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

function calculateMetricsFor(
  objects: readonly S3ObjectMetadata[],
  objectVersions: readonly S3ObjectMetadata[],
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

function determineOldestAndNewest<T extends { readonly lastModified?: Date }>(
  values: readonly T[]
): [T | undefined, T | undefined] {
  const init: [T | undefined, T | undefined] = [undefined, undefined];

  return values.reduce(
    ([oldest, newest], current) => [
      oldest === undefined ||
      (current.lastModified !== undefined &&
        (oldest.lastModified === undefined ||
          current.lastModified < oldest.lastModified))
        ? current
        : oldest,
      newest === undefined ||
      (current.lastModified !== undefined &&
        (newest.lastModified === undefined ||
          current.lastModified > newest.lastModified))
        ? current
        : newest
    ],
    init
  );
}

function createLargestSizeMetric(
  values: readonly { size?: number }[],
  what: string,
  whatHuman: string,
  labels: Readonly<Record<string, string>>
): OpenMetricsMetric {
  const largestObject = values.reduce<{ size?: number } | undefined>(
    (largest, current) =>
      largest === undefined ||
      (current.size !== undefined &&
        (largest.size === undefined || current.size > largest.size))
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
        value: largestObject?.size ?? -1
      }
    ]
  };
}

function createTotalSizeMetric(
  values: readonly { size?: number }[],
  what: string,
  whatHuman: string,
  labels: Readonly<Record<string, string>>
): OpenMetricsMetric {
  const totalSize = values.reduce((sum, obj) => sum + (obj.size ?? 0), 0);
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
  oldest: { readonly lastModified?: Date; readonly size?: number } | undefined,
  what: string,
  whatHuman: string,
  labels: Readonly<Record<string, string>>
): readonly OpenMetricsMetric[] {
  return [
    {
      type: 'gauge',
      name: `s3_oldest_${what}_last_modified_date_seconds`,
      unit: 'seconds',
      help: `The last modification time of the oldest ${whatHuman}, in seconds since the epoch`,
      values: [
        {
          labels,
          value: pipe(
            O.fromNullable(oldest?.lastModified?.getTime()),
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
      values: [{ labels, value: oldest?.size ?? -1 }]
    }
  ];
}

function createNewestMetrics(
  newest: { readonly lastModified?: Date; readonly size?: number } | undefined,
  what: string,
  whatHuman: string,
  labels: Readonly<Record<string, string>>
): readonly OpenMetricsMetric[] {
  return [
    {
      type: 'gauge',
      name: `s3_newest_${what}_last_modified_date_seconds`,
      unit: 'seconds',
      help: `The last modification time of the newest ${whatHuman}, in seconds since the epoch`,
      values: [
        {
          labels,
          value: pipe(
            O.fromNullable(newest?.lastModified?.getTime()),
            O.map(N.divide(1000)),
            O.getWithDefault(-1)
          )
        }
      ]
    },
    {
      type: 'gauge',
      name: `s3_newest_${what}_size_bytes`,
      unit: 'bytes',
      help: `The byte size of the newest ${whatHuman}`,
      values: [
        {
          labels,
          value: newest?.size ?? -1
        }
      ]
    }
  ];
}
