/**
 * Jest setup file – provides minimal globals that Next.js API routes expect.
 * This resolves with `ReferenceError: Request is not defined` errors seen in tests
 * that import from `next/server`.
 */

// Mock winston-daily-rotate-file BEFORE any imports
jest.mock('winston-daily-rotate-file', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    log: jest.fn((_info, callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    }),
  })),
}));

// Mock fs for API route tests
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

// Mock logger for API route tests
jest.mock("@/lib/logger", () => ({
  getLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Mock validation utils for API route tests
const validateRequestBodyMock = jest.fn();
const validateConfigMock = jest.fn();
jest.mock("@/lib/validation-utils", () => ({
  validateRequestBody: validateRequestBodyMock,
  validateConfig: validateConfigMock,
}));

// Make mocks available globally for tests
(global as any).validateRequestBody = validateRequestBodyMock;
(global as any).validateConfig = validateConfigMock;

// Invalidate model templates cache before each test
beforeEach(() => {
  try {
    require('@/lib/model-templates-config').invalidateModelTemplatesCache();
  } catch (e) {
    // Ignore if module not loaded
  }
});

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
  static json(data: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(data), init);
  }
};

// Add setImmediate for tests that use it (like websocket-transport)
if (typeof (global as any).setImmediate === 'undefined') {
  (global as any).setImmediate = (callback: () => void) => {
    setTimeout(callback, 0);
  };
}

// Mock specific MUI components first (before the general mock to ensure consistency)
const createMUIComponent = (tagName: string, testId?: string) => (props: any) =>
  React.createElement(tagName, { ...require('./jest-mocks.ts').filterMUIProps(props), ...(testId ? { 'data-testid': testId } : {}) }, props.children);

// Mock @mui/material components before any imports happen
jest.mock('@mui/material/Box', () => createMUIComponent('div'));
jest.mock('@mui/material/Card', () => createMUIComponent('div', 'card'));
jest.mock('@mui/material/CardActions', () => createMUIComponent('div'));
jest.mock('@mui/material/CardContent', () => createMUIComponent('div'));
jest.mock('@mui/material/CardHeader', () => createMUIComponent('div'));
jest.mock('@mui/material/CircularProgress', () => createMUIComponent('div', 'circular-progress'));
jest.mock('@mui/material/Grid', () => (props: any) => {
  const { size, ...otherProps } = props;
  return React.createElement('div', { ...require('./jest-mocks.ts').filterMUIProps(otherProps), 'data-testid': 'grid' }, props.children);
});
jest.mock('@mui/material/Paper', () => createMUIComponent('div', 'paper'));
jest.mock('@mui/material/Typography', () => (props: any) =>
  React.createElement(props.variant === 'h1' || props.variant === 'h2' || props.variant === 'h3' || props.variant === 'h4' || props.variant === 'h5' || props.variant === 'h6'
    ? props.variant
    : 'p', require('./jest-mocks.ts').filterMUIProps(props), props.children));
jest.mock('@mui/material/Button', () => (props: any) =>
  React.createElement('button', { ...require('./jest-mocks.ts').filterMUIProps(props), 'data-testid': 'button' }, props.children));
jest.mock('@mui/material/InputAdornment', () => (props: any) =>
  React.createElement('span', { ...require('./jest-mocks.ts').filterMUIProps(props) }, props.children));
jest.mock('@mui/material/IconButton', () => (props: any) =>
  React.createElement('button', { ...require('./jest-mocks.ts').filterMUIProps(props), 'data-testid': 'icon-button', type: 'button' }, props.children));
jest.mock('@mui/material/Pagination', () => (props: any) =>
  React.createElement('div', { ...require('./jest-mocks.ts').filterMUIProps(props), 'data-testid': 'pagination' }, props.children));
jest.mock('@mui/material/Chip', () => (props: any) =>
  React.createElement('span', { ...require('./jest-mocks.ts').filterMUIProps(props), 'data-testid': 'chip' }, props.label || props.children));
jest.mock('@mui/material/MenuItem', () => (props: any) =>
  React.createElement('option', { ...require('./jest-mocks.ts').filterMUIProps(props), value: props.value }, props.children));
jest.mock('@mui/material/Select', () => (props: any) => {
  const { open, onOpen, onClose, ...filteredProps } = require('./jest-mocks.ts').filterMUIProps(props);
  return React.createElement('select', {
    ...filteredProps,
    'data-testid': 'select',
    'role': 'combobox',
    value: props.value,
    onClick: () => onOpen && onOpen(),
    onBlur: () => onClose && onClose(),
  }, props.children);
});
jest.mock('@mui/material/Checkbox', () => (props: any) =>
  React.createElement('input', { ...require('./jest-mocks.ts').filterMUIProps(props), 'data-testid': 'checkbox', type: 'checkbox', checked: props.checked }));
jest.mock('@mui/material/ListItemText', () => (props: any) =>
  React.createElement('span', { ...require('./jest-mocks.ts').filterMUIProps(props) }, props.primary || props.children));

// General mock for @mui/material (fallback for any components not specifically mocked above)
jest.mock('@mui/material', () => {
  return require('./jest-mocks.ts').muiMocks;
});

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
  LineChart: React.forwardRef((props: any, ref: any) => {
    const { children, ...domProps } = props;
    const safeProps = Object.keys(domProps).reduce((acc, key) => {
      if (!['xAxis', 'yAxis', 'series', 'dataset', 'margin', 'height', 'width', 'sx'].includes(key)) {
        acc[key] = domProps[key];
      }
      return acc;
    }, {} as any);
    return React.createElement('div', { ...safeProps, ref, 'data-testid': 'line-chart' }, children);
  }),
  ChartsXAxis: React.forwardRef((props: any, ref: any) => {
    const { label, tickLabelStyle, ...domProps } = props;
    return React.createElement('div', { ...domProps, ref, 'data-testid': 'charts-x-axis' });
  }),
  ChartsYAxis: React.forwardRef((props: any, ref: any) => {
    const { label, tickLabelStyle, ...domProps } = props;
    return React.createElement('div', { ...domProps, ref, 'data-testid': 'charts-y-axis' });
  }),
  ChartsGrid: React.forwardRef((props: any, ref: any) => {
    const { vertical, horizontal, ...domProps } = props;
    return React.createElement('div', { ...domProps, ref, 'data-testid': 'charts-grid' });
  }),
  ChartsTooltip: React.forwardRef((props: any, ref: any) =>
    React.createElement('div', { ...props, ref, 'data-testid': 'charts-tooltip' })
  ),
  BarChart: (props: any) => React.createElement('div', { ...require('./jest-mocks.ts').filterMUIProps(props), 'data-testid': 'bar-chart' }, 'BarChart'),
}));

// Mock MUI icons
jest.mock('@mui/icons-material', () => {
  const filterProps = (props: any) => {
    const { sx, ...filtered } = props;
    return filtered;
  };

  return require('./jest-mocks.ts').iconMocks;
});

// Mock Lucide React icons
jest.mock('lucide-react', () => {
  const filterProps = (props: any) => {
    const { sx, ...filtered } = props;
    return filtered;
  };

  const IconComponent = (props: any) => React.createElement('svg', { ...filterProps(props), role: 'img' });

  return {
    __esModule: true,
    default: {
      Monitor: IconComponent,
      Bot: IconComponent,
      FileText: IconComponent,
      Settings: IconComponent,
      X: IconComponent,
      Home: IconComponent,
      Rocket: IconComponent,
      Dashboard: IconComponent,
      ModelTraining: IconComponent,
      Menu: IconComponent,
      ChevronLeft: IconComponent,
      ChevronRight: IconComponent,
      Sun: IconComponent,
      Moon: IconComponent,
    },
    Monitor: IconComponent,
    Bot: IconComponent,
    FileText: IconComponent,
    Settings: IconComponent,
    X: IconComponent,
    Home: IconComponent,
    Rocket: IconComponent,
    Dashboard: IconComponent,
    ModelTraining: IconComponent,
    Menu: IconComponent,
    ChevronLeft: IconComponent,
    ChevronRight: IconComponent,
    Sun: IconComponent,
    Moon: IconComponent,
  };
});


// Mock MUI styles
jest.mock('@mui/material/styles', () => {
  const muiStyles = require('./jest-mocks.ts').muiStyles;
  return {
    ...muiStyles,
    default: muiStyles,
  };
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

// Mock next/server for API route tests
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: async () => data,
      headers: new Headers(),
      ok: (init?.status || 200) < 400,
      cookies: {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        getSetCookie: jest.fn(() => []),
      },
    })),
  },
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
