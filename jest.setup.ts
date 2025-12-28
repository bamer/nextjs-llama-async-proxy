/**
 * Jest setup file – provides minimal globals that Next.js API routes expect.
 * This resolves with `ReferenceError: Request is not defined` errors seen in tests
 * that import from `next/server`.
 */
import React from 'react';
import '@testing-library/jest-dom';
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

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Monitor: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Monitor', role: 'img' }),
  Bot: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Bot', role: 'img' }),
  FileText: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'FileText', role: 'img' }),
  Settings: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Settings', role: 'img' }),
  X: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'X', role: 'img' }),
  Home: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Home', role: 'img' }),
  Rocket: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Rocket', role: 'img' }),
  Dashboard: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Dashboard', role: 'img' }),
  ModelTraining: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'ModelTraining', role: 'img' }),
  Menu: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Menu', role: 'img' }),
  ChevronLeft: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'ChevronLeft', role: 'img' }),
  ChevronRight: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'ChevronRight', role: 'img' }),
}));

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

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
  useTheme: jest.fn(() => ({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() })),
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

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

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
