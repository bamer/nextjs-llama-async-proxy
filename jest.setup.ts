/**
 * Jest setup file – provides minimal globals that Next.js API routes expect.
 * This resolves with `ReferenceError: Request is not defined` errors seen in tests
 * that import from `next/server`.
 */
(global as any).Request = class Request {
  url: string;
  method: string;
  constructor(url: string, init: RequestInit | undefined) {
    this.url = url;
    this.method = (init && init.method) ?? 'GET';
  }
};

(global as any).Response = class Response {
  body: unknown;
  status: number;
  constructor(body?: unknown, init?: ResponseInit) {
    this.body = body;
    this.status = (init && init.status) || 200;
  }
  json() {
    return Promise.resolve(this.body);
  }
};

// Add setImmediate for tests that use it (like websocket-transport)
if (typeof (global as any).setImmediate === 'undefined') {
  (global as any).setImmediate = (callback: () => void) => {
    setTimeout(callback, 0);
  };
}

// Mock MUI components for testing (MUI v7 compatibility)
jest.mock('@mui/material', () => {
  return require('./jest-mocks').muiMocks;
});

// Mock MUI icons
jest.mock('@mui/icons-material', () => {
  return require('./jest-mocks').iconMocks;
});

// Mock @mui/material/useMediaQuery
jest.mock('@mui/material/useMediaQuery', () => {
  return jest.fn(() => false);
});
