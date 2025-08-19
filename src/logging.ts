import log4js from 'log4js';

export type LoggerFactory = (category: string) => log4js.Logger;

export function createLoggerFactory(level: string): LoggerFactory {
  return category => {
    const logger = log4js.getLogger(category);
    logger.level = level;
    return logger;
  };
}
