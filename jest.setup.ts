/**
 * Jest setup file – provides minimal globals that Next.js API routes expect.
 * This resolves with `ReferenceError: Request is not defined` errors seen in tests
 * that import from `next/server`.
 */
import React from 'react';
import '@testing-library/jest-dom';

// Mock @emotion/styled and @emotion/react first
jest.mock('@emotion/styled', () => {
  return jest.fn((tag: any) => tag);
});

jest.mock('@emotion/styled/base', () => ({
  default: jest.fn((tag: any) => tag),
}));

jest.mock('@emotion/react', () => ({
  keyframes: jest.fn(() => ''),
  css: jest.fn(),
}));
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
  return require('./jest-mocks.ts').muiMocks;
});

// Mock specific MUI component paths
jest.mock('@mui/material/Box', () => ({
  default: (props: any) => React.createElement('div', require('./jest-mocks.ts').filterMUIProps(props), props.children),
}));

jest.mock('@mui/material/Card', () => ({
  default: (props: any) => React.createElement('div', { ...require('./jest-mocks.ts').filterMUIProps(props), 'data-testid': 'card' }, props.children),
}));

jest.mock('@mui/material/CardActions', () => ({
  default: (props: any) => React.createElement('div', require('./jest-mocks.ts').filterMUIProps(props), props.children),
}));

jest.mock('@mui/material/CardContent', () => ({
  default: (props: any) => React.createElement('div', require('./jest-mocks.ts').filterMUIProps(props), props.children),
}));

jest.mock('@mui/material/CardHeader', () => ({
  default: (props: any) => React.createElement('div', require('./jest-mocks.ts').filterMUIProps(props), props.children),
}));

jest.mock('@mui/material/CircularProgress', () => ({
  default: (props: any) => React.createElement('div', { ...require('./jest-mocks.ts').filterMUIProps(props), 'data-testid': 'circular-progress' }),
}));

jest.mock('@mui/material/Grid', () => ({
  default: (props: any) => {
    const { size, ...otherProps } = props;
    return React.createElement('div', { ...require('./jest-mocks.ts').filterMUIProps(otherProps), 'data-testid': 'grid' }, props.children);
  },
}));

jest.mock('@mui/material/Paper', () => ({
  default: (props: any) => React.createElement('div', { ...require('./jest-mocks.ts').filterMUIProps(props), 'data-testid': 'paper' }, props.children),
}));

// Mock MUI utils
jest.mock('@mui/material/utils', () => ({
  createSvgIcon: (path: any, displayName: string) => {
    const Component = React.forwardRef((props: any, ref: any) =>
      React.createElement('svg', { ...require('./jest-mocks.ts').filterMUIProps(props), ref }, path)
    );
    Component.displayName = displayName;
    return Component;
  },
}));

// Mock @mui/x-charts
jest.mock('@mui/x-charts', () => ({
  LineChart: (props: any) => React.createElement('div', { ...require('./jest-mocks.ts').filterMUIProps(props), 'data-testid': 'line-chart' }, 'LineChart'),
  BarChart: (props: any) => React.createElement('div', { ...require('./jest-mocks.ts').filterMUIProps(props), 'data-testid': 'bar-chart' }, 'BarChart'),
}));

// Mock MUI icons
jest.mock('@mui/icons-material', () => {
  return require('./jest-mocks.ts').iconMocks;
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
  Sun: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Sun', role: 'img' }),
  Moon: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Moon', role: 'img' }),
}));


// Mock MUI styles
jest.mock('@mui/material/styles', () => {
  return require('./jest-mocks.ts').muiStyles;
});



// Mock MUI system
const mockThemeFn = (theme: any) => theme;
const mockMemoTheme = Object.assign(mockThemeFn, { default: mockThemeFn });

jest.mock('@mui/system', () => {
  const mockThemeFn = (theme: any) => theme;
  return {
    ...require('./jest-mocks.ts').muiStyles,
    unstable_getUnit: (value: string | number) => {
      if (typeof value === 'string') {
        const match = value.match(/^(\d+)(px|rem|em|vh|vw|%)$/);
        return match ? match[2] : 'px';
      }
      return 'px';
    },
    memoTheme: Object.assign(mockThemeFn, { default: mockThemeFn }),
    createBox: () => React.forwardRef((props: any, ref: any) => React.createElement('div', { ...require('./jest-mocks.ts').filterMUIProps(props), ref }, props.children)),
  };
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

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn().mockImplementation(() => ({
    defaultOptions: {},
  })),
  QueryClientProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
  })),
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
