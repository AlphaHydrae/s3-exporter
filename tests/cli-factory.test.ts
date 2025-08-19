import { describe, expect, jest, test } from '@jest/globals';

import { cliFactory, CliOptions } from '../src';
import { ServerCommand } from '../src/commands/server';
import { VersionCommand } from '../src/commands/version';

describe('CLI factory', () => {
  test('execute the server command', async () => {
    expect.hasAssertions();

    const options: CliOptions = {
      serverCommand: jest.fn() as ServerCommand,
      versionCommand: jest.fn() as VersionCommand
    };

    const cli = cliFactory(options);

    await cli(['node', 'program', 'server']);

    expect(options.serverCommand).toHaveBeenCalledWith({
      baseUrl: undefined,
      loggerFactory: expect.any(Function),
      port: 3000
    });
    expect(options.versionCommand).not.toHaveBeenCalledWith();
  });

  test('execute the server command with a custom base URL', async () => {
    expect.hasAssertions();

    const options: CliOptions = {
      serverCommand: jest.fn() as ServerCommand,
      versionCommand: jest.fn() as VersionCommand
    };

    const cli = cliFactory(options);

    await cli([
      'node',
      'program',
      'server',
      '--base-url',
      'https://example.alphahydrae.ch'
    ]);

    expect(options.serverCommand).toHaveBeenCalledWith({
      baseUrl: new URL('https://example.alphahydrae.ch'),
      loggerFactory: expect.any(Function),
      port: 3000
    });
    expect(options.versionCommand).not.toHaveBeenCalledWith();
  });

  test('execute the server command with a custom base URL using the short option', async () => {
    expect.hasAssertions();

    const options: CliOptions = {
      serverCommand: jest.fn() as ServerCommand,
      versionCommand: jest.fn() as VersionCommand
    };

    const cli = cliFactory(options);

    await cli([
      'node',
      'program',
      'server',
      '-u',
      'https://example.alphahydrae.ch'
    ]);

    expect(options.serverCommand).toHaveBeenCalledWith({
      baseUrl: new URL('https://example.alphahydrae.ch'),
      loggerFactory: expect.any(Function),
      port: 3000
    });
    expect(options.versionCommand).not.toHaveBeenCalledWith();
  });

  test('execute the server command with a custom port', async () => {
    expect.hasAssertions();

    const options: CliOptions = {
      serverCommand: jest.fn() as ServerCommand,
      versionCommand: jest.fn() as VersionCommand
    };

    const cli = cliFactory(options);

    await cli(['node', 'program', 'server', '--port', '4000']);

    expect(options.serverCommand).toHaveBeenCalledWith({
      baseUrl: undefined,
      loggerFactory: expect.any(Function),
      port: 4000
    });
    expect(options.versionCommand).not.toHaveBeenCalledWith();
  });

  test('execute the server command with a custom port using the short option', async () => {
    expect.hasAssertions();

    const options: CliOptions = {
      serverCommand: jest.fn() as ServerCommand,
      versionCommand: jest.fn() as VersionCommand
    };

    const cli = cliFactory(options);

    await cli(['node', 'program', 'server', '-p', '4000']);

    expect(options.serverCommand).toHaveBeenCalledWith({
      baseUrl: undefined,
      loggerFactory: expect.any(Function),
      port: 4000
    });
    expect(options.versionCommand).not.toHaveBeenCalledWith();
  });

  test('execute the version command', async () => {
    expect.hasAssertions();

    const options: CliOptions = {
      serverCommand: jest.fn() as ServerCommand,
      versionCommand: jest.fn() as VersionCommand
    };

    const cli = cliFactory(options);

    await cli(['node', 'program', 'version']);

    expect(options.versionCommand).toHaveBeenCalledWith();
    expect(options.serverCommand).not.toHaveBeenCalled();
  });
});
