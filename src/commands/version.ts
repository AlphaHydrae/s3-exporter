import { version } from '../constants.js';

export type VersionCommand = () => void;

export function versionCommandFactory(log: typeof console.log): VersionCommand {
  return () => {
    log(version);
  };
}
