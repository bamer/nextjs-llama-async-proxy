import React from 'react';

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