import { A, pipe, R } from '@mobily/ts-belt';
import express, { Request } from 'express';
import isString from 'lodash/isString.js';
import log4js from 'log4js';

import { collectPrometheusMetrics } from './metrics.js';
import { serializeOpenMetricsMetric } from './open-metrics.js';
import { emptyArray } from './utils.js';

const logger = log4js.getLogger('server');
logger.level = 'INFO';

type S3ExporterParams = {
  readonly bucket: string;
  readonly region: string;
  readonly prefixes: readonly string[];
};

export function startServer(): Promise<void> {
  const server = express();
  server.disable('x-powered-by');

  const port = 3000;

  server.get('/', (_req, res) => {
    res.send('S3 Exporter');
  });

  server.get('/metrics', async (req, res) => {
    const config = pipe(
      req,
      parseParameters,
      R.match<S3ExporterParams, string, S3ExporterParams | string>(
        config => config,
        err => err
      )
    );
    if (isString(config)) {
      res.status(400).send(config);
      return;
    }

    const result = await collectPrometheusMetrics(
      config.bucket,
      config.region,
      config.prefixes
    );
    res
      .set(
        'Content-Type',
        'application/openmetrics-text; version=1.0.0; charset=utf-8'
      )
      .send(pipe(result, A.map(serializeOpenMetricsMetric), A.join('\n\n')));
  });

  return new Promise((resolve, reject) => {
    server.listen(port, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }

      logger.info(`Server is running on port ${port}`);
    });
  });
}

function parseParameters(req: Request): R.Result<S3ExporterParams, string> {
  return pipe(
    pipe(
      req,
      parseBucket,
      R.map(bucket => ({ bucket }))
    ),
    R.flatMap(params =>
      pipe(
        req,
        parseRegion,
        R.map(region => ({ ...params, region }))
      )
    ),
    R.flatMap(params =>
      pipe(
        req,
        parsePrefixes,
        R.map(prefixes => ({ ...params, prefixes }))
      )
    )
  );
}

function parseBucket({ query }: Request): R.Result<string, string> {
  const { bucket } = query;
  if (!isString(bucket)) {
    return R.Error('Missing or invalid "bucket" query parameter');
  }

  return R.Ok(bucket);
}

function parseRegion({ query }: Request): R.Result<string, string> {
  const { region } = query;
  if (!isString(region)) {
    return R.Error('Missing or invalid "region" query parameter');
  }

  return R.Ok(region);
}

function parsePrefixes({
  query
}: Request): R.Result<readonly string[], string> {
  const prefixes = emptyArray<string>();
  const { prefix } = query;
  if (isString(prefix)) {
    prefixes.push(prefix);
  } else if (Array.isArray(prefix)) {
    prefixes.push(...prefix.filter(prf => isString(prf)));
  } else if (prefix !== undefined) {
    return R.Error('Invalid "prefix" query parameter');
  }

  return R.Ok(prefixes);
}
