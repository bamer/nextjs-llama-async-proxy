/**
 * Mock data for useLlamaStatus hook tests
 * Provides reusable mock data objects for various test scenarios
 */

// Simple model interface for testing
export interface TestModel {
  id: string;
  name: string;
  [key: string]: unknown;
}

// ============ Basic Status Data ============

/**
 * Default running status with all fields populated
 */
export const mockRunningStatus = {
  status: 'running',
  models: [{ id: '1', name: 'Model 1' }],
  lastError: null,
  retries: 0,
  uptime: 100,
  startedAt: '2024-01-01T00:00:00Z',
};

/**
 * Default starting status
 */
export const mockStartingStatus = {
  status: 'starting',
  models: [],
  lastError: null,
  retries: 0,
  uptime: 0,
  startedAt: null,
};

/**
 * Default stopped status
 */
export const mockStoppedStatus = {
  status: 'stopped',
  models: [],
  lastError: null,
  retries: 0,
  uptime: 200,
  startedAt: '2024-01-01T00:00:00Z',
};

/**
 * Default error status
 */
export const mockErrorStatus = {
  status: 'error',
  models: [],
  lastError: 'Connection failed',
  retries: 3,
  uptime: 100,
  startedAt: '2024-01-01T00:00:00Z',
};

// ============ Null/Undefined Edge Cases ============

export const mockNullStatusData = null;
export const mockUndefinedStatusData = undefined;

export const mockStatusWithNullModels = {
  status: 'running',
  models: null,
  lastError: null,
  retries: 0,
  uptime: 100,
  startedAt: null,
};

export const mockStatusWithUndefinedModels = {
  status: 'running',
  models: undefined,
  lastError: null,
  retries: 0,
  uptime: 100,
  startedAt: null,
};

export const mockStatusWithNullStartedAt = {
  status: 'running',
  models: [],
  lastError: null,
  retries: 0,
  uptime: 100,
  startedAt: null,
};

export const mockStatusWithNullError = {
  status: 'running',
  models: [],
  lastError: null,
  retries: 0,
  uptime: 100,
  startedAt: null,
};

export const mockStatusWithUndefinedError = {
  status: 'running',
  models: [],
  lastError: undefined,
  retries: 0,
  uptime: 100,
  startedAt: null,
};

// ============ Numeric Edge Cases ============

export const mockStatusWithZeroUptime = {
  status: 'running',
  models: [],
  lastError: null,
  retries: 0,
  uptime: 0,
  startedAt: null,
};

export const mockStatusWithNegativeUptime = {
  status: 'running',
  models: [],
  lastError: null,
  retries: 0,
  uptime: -100,
  startedAt: null,
};

export const mockStatusWithMaxUptime = {
  status: 'running',
  models: [],
  lastError: null,
  retries: 0,
  uptime: Number.MAX_SAFE_INTEGER,
  startedAt: null,
};

export const mockStatusWithHighRetries = {
  status: 'running',
  models: [],
  lastError: 'Retrying...',
  retries: 1000,
  uptime: 100,
  startedAt: null,
};

// ============ Models Array Edge Cases ============

export const mockStatusWithEmptyModels = {
  status: 'running',
  models: [],
  lastError: null,
  retries: 0,
  uptime: 100,
  startedAt: null,
};

export const mockStatusWithNullModelEntries = {
  status: 'running',
  models: [null, { id: '1', name: 'Model 1' }, null] as any,
  lastError: null,
  retries: 0,
  uptime: 100,
  startedAt: null,
};

// ============ Special Characters and Unicode ============

export const mockStatusWithSpecialChars = {
  status: 'error',
  models: [],
  lastError: 'Error: <script>alert("xss")</script> & "quotes"',
  retries: 1,
  uptime: 0,
  startedAt: null,
};

export const mockStatusWithUnicode = {
  status: 'running',
  models: [{ id: '1', name: '模型 🚀 测试' }],
  lastError: '错误',
  retries: 0,
  uptime: 100,
  startedAt: null,
};

// ============ Message Types ============

export const mockMetricsMessage = { type: 'metrics', data: { cpu: 50 } };
export const mockModelsMessage = { type: 'models', data: [] };
export const mockLogsMessage = { type: 'logs', data: [] };

// ============ Malformed Messages ============

export const mockMalformedMessages = [
  'string message',
  12345,
  { invalid: 'structure' },
  { type: 'llama_status' }, // missing data
  { data: {} }, // missing type
];

// ============ Partial Data Updates ============

export const mockPartialStatusData = {
  status: 'running',
  models: [],
  // missing other fields
};

// ============ Mock Socket States ============

export const mockNullSocket = null;
export const mockUndefinedSocket = undefined;
export const mockEmptySocket = {};
export const mockSocketWithOnMethod = { on: jest.fn() };

// ============ Model Generators ============

export const createModel = (
  id: string,
  name: string,
  overrides = {}
): TestModel => ({
  id,
  name,
  ...overrides,
});

export const createMockModels = (
  count: number,
  startIndex = 0
): TestModel[] => {
  return Array.from({ length: count }, (_, i) =>
    createModel(
      `model-${startIndex + i}`,
      `Model ${startIndex + i}`
    )
  );
};

// ============ Status Transition Sequences ============

export const mockStatusTransitionSequence = [
  mockStartingStatus,
  {
    ...mockRunningStatus,
    models: [{ id: '1' }],
  },
  mockStoppedStatus,
];
