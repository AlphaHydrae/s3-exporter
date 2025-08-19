/* eslint-disable no-console, unicorn/no-process-exit */
import { O, pipe } from '@mobily/ts-belt';
import chalk from 'chalk';
import log4js from 'log4js';
import yargs, { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';

import { ServerCommand } from '../commands/server.js';
import { VersionCommand } from '../commands/version.js';
import { version } from '../constants.js';
import { createLoggerFactory, LoggerFactory } from '../logging.js';

const { levels } = log4js;

const logLevels = [
  levels.TRACE,
  levels.DEBUG,
  levels.INFO,
  levels.WARN,
  levels.ERROR,
  levels.FATAL
];

export type Cli = (args: string[]) => Promise<void>;

export type CliOptions = {
  readonly serverCommand: ServerCommand;
  readonly versionCommand: VersionCommand;
};

export function cliFactory(options: CliOptions): Cli {
  return async args => {
    await yargs(hideBin(args))
      .help()
      .version(version)
      .env('S3_EXPORTER')
      .wrap(100)
      .option('log-level', {
        alias: 'l',
        description: 'Set the log level',
        default: 'info',
        choices: logLevels.map(level => level.levelStr.toLowerCase()),
        coerce: value =>
          value === undefined ? undefined : String(value).toLowerCase(),
        demandOption: true
      })
      .command(
        ['prometheus', '$0'],
        'Start a server that outputs Prometheus metrics about an AWS S3 bucket',
        opts =>
          opts
            .option('base-url', {
              alias: 'u',
              description: 'Base URL for the server',
              type: 'string',
              coerce: coerceUrl
            })
            .option('port', {
              alias: 'p',
              description: 'Port to listen on',
              type: 'number',
              default: 3000
            }),
        opts =>
          options.serverCommand({
            baseUrl: opts.baseUrl,
            port: opts.port,
            loggerFactory: loggerFactory(opts.logLevel)
          })
      )
      .command(
        'version',
        'Print the version of S3 exporter',
        opts => opts,
        handleVersionCommand(options.versionCommand)
      )
      .fail(errorHandler)
      .parseAsync();
  };
}

function coerceUrl(value: unknown): URL {
  try {
    return new URL(String(value));
  } catch {
    throw new Error(`Invalid base URL ${String(value)}`);
  }
}

function handleVersionCommand(command: VersionCommand): () => void {
  return () => {
    command();
  };
}

function loggerFactory(
  logLevel: string | undefined
): LoggerFactory | undefined {
  return pipe(
    O.fromNullable(logLevel),
    O.map(createLoggerFactory),
    O.toUndefined
  );
}

function errorHandler(msg: string, err: Error, program: Argv<unknown>): void {
  if (msg) {
    console.error();
    console.error(chalk.yellow(msg));
  }

  chalk.red(err.stack);

  console.error();
  program.showHelp('error');
  console.error();

  process.exit(1);
}
