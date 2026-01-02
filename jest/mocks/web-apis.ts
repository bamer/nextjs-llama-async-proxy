/**
 * Web APIs mocks for Jest setup
 * Includes Request, Response, setImmediate, ReadableStream, fetch, and localStorage
 */

// Mock Request class
(global as any).Request = class Request {
  url: string;
  method: string;
  constructor(url: string, init: RequestInit | undefined) {
    this.url = url;
    this.method = (init && init.method) ?? 'GET';
  }
};

// Mock Response class
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

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});