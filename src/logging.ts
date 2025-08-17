import log4js from 'log4js';

export function getLogger(category: string): log4js.Logger {
  const logger = log4js.getLogger(category);
  logger.level = 'INFO';
  return logger;
}
