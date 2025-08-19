/* eslint-disable no-console */
import { cliFactory } from './cli/factory.js';
import { serverCommandFactory } from './commands/server.js';
import { versionCommandFactory } from './commands/version.js';
import { MetricsCollector } from './metrics/metrics-collector.js';
import { S3 } from './metrics/s3.js';

export const defaultCli = cliFactory({
  serverCommand: serverCommandFactory(
    MetricsCollector.factory({ s3Factory: S3.factory })
  ),
  versionCommand: versionCommandFactory(console.log.bind(console))
});

export default async function cli(args: string[]): Promise<void> {
  await defaultCli(args);
}
