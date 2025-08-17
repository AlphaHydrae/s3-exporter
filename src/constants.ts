import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// eslint-disable-next-line no-underscore-dangle,@typescript-eslint/naming-convention
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(__dirname, '..');

export const envVarPrefix = 'S3_EXPORTER_';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access, prefer-destructuring
export const version: string = pkg.version;

// Dependency injection tokens
export const configOptionsToken = Symbol('CONFIG_OPTIONS');
export const logLevelToken = Symbol('LOG_LEVEL');
export const remoteEnvToken = Symbol('REMOTE_ENV_TOKEN');
