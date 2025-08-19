import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*', 'tests/**/*'],
  coverageDirectory: './coverage',
  coverageReporters: ['clover', 'html', 'json', 'lcov', 'text'],
  extensionsToTreatAsEsm: ['.ts'],
  forceCoverageMatch: ['**/*.ts'],
  moduleNameMapper: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '#(.*)': '$1'
  },
  preset: 'ts-jest/presets/default-esm',
  setupFilesAfterEnv: ['jest-extended/all'],
  testEnvironment: 'jest-environment-node',
  testPathIgnorePatterns: ['dist', 'tmp'],
  transform: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.test.json',
        useESM: true
      }
    ]
  }
};

export default jestConfig;
