import React from 'react';

// Import shared utilities from jest-mocks.ts
const { filterMUIProps, muiStyles } = require('../../jest-mocks');

// Mock MUI styles
jest.mock('@mui/material/styles', () => {
  const muiStyles = require('../../jest-mocks').muiStyles;
  return {
    ...muiStyles,
    default: muiStyles,
  };
});

// Mock MUI system
jest.mock('@mui/system', () => {
  const mockThemeFn = (theme: any) => theme;
  return {
    ...require('../../jest-mocks').muiStyles,
    unstable_getUnit: (value: string | number) => {
      if (typeof value === 'string') {
        const match = value.match(/^(\d+)(px|rem|em|vh|vw|%)$/);
        return match ? match[2] : 'px';
      }
      return 'px';
    },
    memoTheme: Object.assign(mockThemeFn, { default: mockThemeFn }),
    createBox: () => React.forwardRef((props: any, ref: any) => React.createElement('div', { ...filterMUIProps(props), ref }, props.children)),
  };
});

// Mock MUI system
const mockThemeFn = (theme: any) => theme;
const mockMemoTheme = Object.assign(mockThemeFn, { default: mockThemeFn });

jest.mock('@mui/system', () => {
  const mockThemeFn = (theme: any) => theme;
  return {
    ...require('../../jest-mocks.ts').muiStyles,
    unstable_getUnit: (value: string | number) => {
      if (typeof value === 'string') {
        const match = value.match(/^(\d+)(px|rem|em|vh|vw|%)$/);
        return match ? match[2] : 'px';
      }
      return 'px';
    },
    memoTheme: Object.assign(mockThemeFn, { default: mockThemeFn }),
    createBox: () => React.forwardRef((props: any, ref: any) => React.createElement('div', { ...filterMUIProps(props), ref }, props.children)),
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