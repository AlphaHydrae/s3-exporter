import { LoggerFactory } from '../logging.js';
import { MetricsCollectorFactory } from '../metrics/metrics-collector.js';
import { Server } from '../server/server.js';

export type ServerCommand = (options: ServerCommandOptions) => Promise<void>;

export type ServerCommandOptions = {
  readonly baseUrl?: URL;
  readonly port: number;
  readonly loggerFactory?: LoggerFactory;
};

export function serverCommandFactory(
  metricsCollectorFactory: MetricsCollectorFactory
): ServerCommand {
  return async (options: ServerCommandOptions) => {
    const server = new Server({
      ...options,
      metricsCollectorFactory
    });

    await server.start();
  };
}
