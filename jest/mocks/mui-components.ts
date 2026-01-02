import React from 'react';

// Import shared utilities from jest-mocks.ts
const { filterMUIProps } = require('../../jest-mocks');

// Mock specific MUI components first (before the general mock to ensure consistency)
const createMUIComponent = (tagName: string, testId?: string) => (props: any) =>
  React.createElement(tagName, { ...filterMUIProps(props), ...(testId ? { 'data-testid': testId } : {}) }, props.children);

// Mock @mui/material components before any imports happen
jest.mock('@mui/material/Box', () => createMUIComponent('div'));
jest.mock('@mui/material/Card', () => createMUIComponent('div', 'card'));
jest.mock('@mui/material/CardActions', () => createMUIComponent('div'));
jest.mock('@mui/material/CardContent', () => createMUIComponent('div'));
jest.mock('@mui/material/CardHeader', () => createMUIComponent('div'));
jest.mock('@mui/material/CircularProgress', () => createMUIComponent('div', 'circular-progress'));
jest.mock('@mui/material/Grid', () => (props: any) => {
  const { size, ...otherProps } = props;
  return React.createElement('div', { ...filterMUIProps(otherProps), 'data-testid': 'grid' }, props.children);
});
jest.mock('@mui/material/Paper', () => createMUIComponent('div', 'paper'));
jest.mock('@mui/material/Typography', () => (props: any) =>
  React.createElement(props.variant === 'h1' || props.variant === 'h2' || props.variant === 'h3' || props.variant === 'h4' || props.variant === 'h5' || props.variant === 'h6'
    ? props.variant
    : 'p', filterMUIProps(props), props.children));
jest.mock('@mui/material/Button', () => (props: any) =>
  React.createElement('button', { ...filterMUIProps(props), 'data-testid': 'button' }, props.children));
jest.mock('@mui/material/InputAdornment', () => (props: any) =>
  React.createElement('span', { ...filterMUIProps(props) }, props.children));
jest.mock('@mui/material/IconButton', () => (props: any) =>
  React.createElement('button', { ...filterMUIProps(props), 'data-testid': 'icon-button', type: 'button' }, props.children));
jest.mock('@mui/material/Pagination', () => (props: any) =>
  React.createElement('div', { ...filterMUIProps(props), 'data-testid': 'pagination' }, props.children));
jest.mock('@mui/material/Chip', () => (props: any) =>
  React.createElement('span', { ...filterMUIProps(props), 'data-testid': 'chip' }, props.label || props.children));
jest.mock('@mui/material/MenuItem', () => (props: any) =>
  React.createElement('option', { ...filterMUIProps(props), value: props.value }, props.children));
jest.mock('@mui/material/Select', () => (props: any) => {
  const { open, onOpen, onClose, onChange, ...filteredProps } = filterMUIProps(props);
  return React.createElement('select', {
    ...filteredProps,
    'data-testid': 'select',
    'role': 'combobox',
    value: props.value,
    onClick: () => onOpen && onOpen(),
    onBlur: () => onClose && onClose(),
    onChange: onChange || (() => {}),
  }, props.children);
});
jest.mock('@mui/material/Checkbox', () => (props: any) =>
  React.createElement('input', { 
    ...filterMUIProps(props), 
    'data-testid': 'checkbox', 
    type: 'checkbox', 
    checked: props.checked,
    onChange: props.onChange || (() => {}),
  }));
jest.mock('@mui/material/ListItemText', () => (props: any) =>
  React.createElement('span', { ...filterMUIProps(props) }, props.primary || props.children));

// General mock for @mui/material (fallback for any components not specifically mocked above)
jest.mock('@mui/material', () => {
  return require('../../jest-mocks').muiMocks;
});

// Mock MUI utils
jest.mock('@mui/material/utils', () => ({
  createSvgIcon: (path: any, displayName: string) => {
    const Component = React.forwardRef((props: any, ref: any) =>
      React.createElement('svg', { ...filterMUIProps(props), ref }, path)
    );
    Component.displayName = displayName;
    return Component;
  },
}));

// Mock @mui/x-charts
jest.mock('@mui/x-charts', () => ({
  LineChart: (props: any) => React.createElement('div', { ...filterMUIProps(props), 'data-testid': 'line-chart' }, 'LineChart'),
  BarChart: (props: any) => React.createElement('div', { ...filterMUIProps(props), 'data-testid': 'bar-chart' }, 'BarChart'),
}));