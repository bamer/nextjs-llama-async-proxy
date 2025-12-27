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

// Mock MUI styles
jest.mock('@mui/material/styles', () => {
  return require('./jest-mocks').muiStyles;
});

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: jest.fn(),
    theme: 'light',
  }),
  ThemeProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

// Mock ReadableStream for Server-Sent Events
// Simple mock that doesn't require fake timers
let mockStreamQueue: any[] = [];
let mockStreamController: any = null;

class MockReadableStream {
  constructor(controllerCallback: any) {
    // Store controller
    mockStreamController = {
      enqueue: (value: any) => {
        mockStreamQueue.push(value);
      },
      close: () => {
        // Mark end of stream
      },
      cancel: jest.fn(),
    };
    // Call the start callback asynchronously (as in real implementation)
    setImmediate(() => {
      try {
        controllerCallback(mockStreamController);
      } catch (e) {
        // Ignore errors
      }
    });
  }

  getReader() {
    return {
      read: () => {
        return new Promise((resolve) => {
          // Check immediately if data is available
          if (mockStreamQueue.length > 0) {
            const value = mockStreamQueue.shift();
            resolve({ done: false, value });
            return;
          }
          // Otherwise, return done
          resolve({ done: true, value: undefined });
        });
      },
    };
  }
}

(global as any).ReadableStream = MockReadableStream;

// Helper to reset mock stream between tests
(global as any).clearMockStreamQueue = () => {
  mockStreamQueue = [];
  mockStreamController = null;
};
