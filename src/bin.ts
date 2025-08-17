import chalk from 'chalk';
import isError from 'lodash/isError.js';
import 'reflect-metadata';

import cli from './cli.js';

Promise.resolve(process.argv)
  .then(cli)
  // eslint-disable-next-line unicorn/prefer-top-level-await
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error(chalk.red(isError(err) ? err.stack : err));
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  });
