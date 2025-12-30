import type { Config } from 'jest';

const jestConfig: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Temporarily removed mui-mocks.tsx due to module resolution issues
  moduleNameMapper: {
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^.+\\.module\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^.+\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/style-mock.js',
  },
  snapshotSerializers: ['@emotion/jest/serializer'],
  // Increase memory limits for tests
  maxWorkers: '50%',
  workerIdleMemoryLimit: '512MB',
  testTimeout: 10000, // Increase from default 5000ms to 10000ms (10 seconds)
  cache: false,
  bail: false,
  verbose: true,
  maxConcurrency: 2,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!app/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!app/**/*.stories.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98,
    },
  },
  testMatch: [
    '**/__tests__/**/*.{test,spec}.{ts,tsx}',
    '**/*.test.{ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(axios|@mui|@emotion)/)',
  ],
};

export default jestConfig;
