/* eslint-disable no-console, unicorn/no-process-exit */
import chalk from 'chalk';
import isError from 'lodash/isError.js';
import log4js from 'log4js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { version } from './constants.js';
import { startServer } from './server.js';

const { levels } = log4js;

const logLevels = [
  levels.TRACE,
  levels.DEBUG,
  levels.INFO,
  levels.WARN,
  levels.ERROR,
  levels.FATAL
];

// eslint-disable-next-line max-lines-per-function
export default async function cli(args: string[]): Promise<void> {
  // await loadDotenvConfig();

  await yargs(hideBin(args))
    .help()
    .version(version)
    .env('S3_EXPORTER')
    .wrap(100)
    .option('config', {
      type: 'string',
      description: 'Use a custom configuration file',
      alias: ['c']
    })
    .option('log-level', {
      alias: 'l',
      description: 'Set the log level',
      choices: logLevels.map(level => level.levelStr.toLowerCase()),
      coerce: value =>
        value === undefined ? undefined : String(value).toLowerCase()
    })
    .option('skip-prompts', {
      alias: ['y', 'yes'],
      description: 'Skip confirmation prompts',
      type: 'boolean'
    })
    .option('json', {
      description: 'Output data in JSON format',
      type: 'boolean',
      default: false
    })
    .command(
      ['prometheus', '$0'],
      'Start a server that outputs Prometheus metrics about an AWS S3 bucket',
      opts => opts,
      () => startServer()
    )
    .command(
      'version',
      'Print the version of S3 exporter',
      opts => opts,
      () => {
        console.log(version);
      }
    )
    .fail((msg, err, program) => {
      if (msg) {
        console.error();
        console.error(chalk.yellow(msg));
      }

      chalk.red(isError(err) ? err.stack : err);

      console.error();
      program.showHelp('error');
      console.error();

      process.exit(1);
    })
    .parse();
}
