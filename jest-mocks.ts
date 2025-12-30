
import React from 'react';

// List of MUI-specific props to filter out from DOM
export const muiProps = [
  'sx', 'mt', 'mb', 'ml', 'mr', 'my', 'mx', 'pt', 'pb', 'pl', 'pr', 'py', 'px', 'p', 'm',
  'gap', 'flex', 'justifyContent', 'alignItems', 'display', 'height', 'width', 'fullWidth',
  'centered', 'size', 'variant', 'color', 'disabled', 'gutterBottom', 'subheader', 'title',
  'position', 'zIndex', 'overflow', 'textAlign', 'primaryTypographyProps', 'disablePadding',
  'dense', 'component', 'href', 'to', 'noWrap', 'align', 'elevation', 'square', 'spacing',
  'direction', 'container', 'item', 'xs', 'sm', 'md', 'lg', 'xl', 'onClose', 'open',
  'anchorEl', 'anchorOrigin', 'transformOrigin', 'getContentAnchorEl', 'PaperProps',
  'MenuListProps', 'onClick', 'primary', 'secondary', 'error', 'warning', 'info', 'success',
  'severity', 'icon', 'onExited', 'in', 'timeout', 'unmountOnExit', 'appear', 'startIcon',
  'endIcon', 'orientation', 'value', 'onChange', 'label',
  'overlap', 'badgeContent',
  // Form-specific props
  'helperText', 'SelectProps', 'inputProps', 'InputProps', 'select', 'checked', 'defaultChecked', 'readOnly',
  // Grid props
  'size',
  // Accordion props
  'expandIcon', 'expanded', 'defaultExpanded', 'TransitionComponent', 'TransitionProps',
  // Dialog props
  'maxWidth', 'fullScreen', 'scroll', 'BackdropComponent', 'BackdropProps',
  // Additional props from test failures
  'startIcon', 'fullWidth', 'container',
];

export const filterMUIProps = (props: any) => {
  const filtered: any = {};
  Object.keys(props || {}).forEach(key => {
    if (!muiProps.includes(key) && key !== 'ownerState') {
      filtered[key] = props[key];
    }
  });
  return filtered;
};

// Mock Theme
const mockTheme = {
  palette: {
    primary: { main: '#1976d2', contrastText: '#fff' },
    secondary: { main: '#dc004e' },
    error: { main: '#d32f2f' },
    warning: { main: '#ed6c02', light: '#ff9800', dark: '#e65100' },
    info: { main: '#0288d1' },
    success: { main: '#2e7d32' },
    mode: 'light',
    action: { hover: '#f5f5f5' },
    divider: '#e0e0e0',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
    down: (key: string) => `@media (max-width:${mockTheme.breakpoints.values[key as keyof typeof mockTheme.breakpoints.values] - 1}px)`,
    up: (key: string) => `@media (min-width:${mockTheme.breakpoints.values[key as keyof typeof mockTheme.breakpoints.values]}px)`,
  },
  spacing: (factor: number) => `${factor * 8}px`,
  shadows: Array(25).fill('none').map((_, i) => i === 0 ? 'none' : `0px ${i}px ${i * 2}px rgba(0,0,0,0.1)`),
  shape: { borderRadius: 4 },
};

// Mock createTheme function
const createTheme = (options?: any) => ({
  ...mockTheme,
  ...options,
});

// Mock ThemeProvider
const ThemeProvider = ({ children, theme: _theme }: { children: React.ReactNode; theme?: any }) => {
  return React.createElement('div', { 'data-theme-provider': 'true' }, children);
};

// MUI Material mocks
export const muiMocks = {
  // Layout components
  Box: (props: any) => React.createElement('div', filterMUIProps(props), props.children),
  Container: (props: any) => React.createElement('div', { ...filterMUIProps(props), 'data-testid': 'container' }, props.children),
   Grid: (props: any) => {
     const { size, ...otherProps } = props;
     return React.createElement('div', { ...filterMUIProps(otherProps), 'data-testid': 'grid' }, props.children);
   },
  Paper: (props: any) => React.createElement('div', { ...filterMUIProps(props), 'data-testid': 'paper' }, props.children),
  Card: (props: any) => React.createElement('div', { ...filterMUIProps(props), className: 'MuiCard-root' }, props.children),
  CardContent: (props: any) => React.createElement('div', filterMUIProps(props), props.children),
   CardHeader: (props: any) => {
     const { title, subheader, ...otherProps } = props;
     return React.createElement('div', filterMUIProps(otherProps), [
       title && React.createElement('div', { key: 'title', 'data-testid': 'card-header-title' }, title),
       subheader && React.createElement('div', { key: 'subheader', 'data-testid': 'card-header-subheader' }, subheader),
       props.children
     ].filter(Boolean));
   },

   // Form components
   TextField: (props: any) => React.createElement('div', filterMUIProps(props), props.children),
  Button: (props: any) => React.createElement('button', filterMUIProps(props), props.children),
  IconButton: (props: any) => React.createElement('button', filterMUIProps(props), props.children),
  Chip: (props: any) => React.createElement('div', filterMUIProps(props), props.children),

   // Typography
   Typography: (props: any) => {
     const component = props.component || (props.variant === 'h6' ? 'h6' : props.variant === 'h5' ? 'h5' : props.variant === 'h4' ? 'h4' : props.variant === 'h3' ? 'h3' : props.variant === 'h2' ? 'h2' : props.variant === 'h1' ? 'h1' : 'span');
     return React.createElement(component, filterMUIProps(props), props.children);
   },

   // Feedback
     CircularProgress: (props: any) => React.createElement('div', { ...filterMUIProps(props), 'data-testid': 'circular-progress' }),
     LinearProgress: (props: any) => React.createElement('div', { ...filterMUIProps(props), 'data-testid': 'linear-progress', role: 'progressbar' }, `Loading... ${props.value}%`),
    Skeleton: (props: any) => React.createElement('div', { ...filterMUIProps(props), 'data-testid': 'skeleton' }),
    Alert: (props: any) => React.createElement('div', { ...filterMUIProps(props), 'data-testid': 'alert' }, props.children),

  // Dialog components
  Dialog: (props: any) => React.createElement('div', { ...filterMUIProps(props), 'data-testid': 'dialog' }, props.children),
  DialogTitle: (props: any) => React.createElement('div', { ...filterMUIProps(props), 'data-testid': 'dialog-title' }, props.children),
  DialogContent: (props: any) => React.createElement('div', { ...filterMUIProps(props), 'data-testid': 'dialog-content' }, props.children),
  DialogActions: (props: any) => React.createElement('div', { ...filterMUIProps(props), 'data-testid': 'dialog-actions' }, props.children),

   // Data display
   Select: (props: any) => {
     const { onChange, value, ...otherProps } = props;
     return React.createElement('select', {
       ...filterMUIProps(otherProps),
       defaultValue: value || '',
       onChange: onChange,
       role: 'combobox'
     }, props.children);
   },
   Avatar: (props: any) => React.createElement('div', filterMUIProps(props), props.children),
  Badge: (props: any) => React.createElement('div', filterMUIProps(props), props.children),
  Tooltip: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  SvgIcon: (props: any) => React.createElement('svg', filterMUIProps(props), props.children),

  // Form components
  Slider: (props: any) => React.createElement('input', { ...filterMUIProps(props), type: 'range' }),
     Switch: (props: any) => {
       const { checked, onChange, ...otherProps } = props;
       return React.createElement('input', {
         ...filterMUIProps(otherProps),
         type: 'checkbox',
         checked: checked || false,
         onChange: onChange || (() => {}),
         role: 'switch',
         'aria-checked': checked || false
       });
     },

   MenuItem: (props: any) => React.createElement('option', filterMUIProps(props), typeof props.children === 'string' ? props.children : ''),
  FormControl: (props: any) => React.createElement('div', filterMUIProps(props), props.children),
  InputLabel: (props: any) => React.createElement('label', filterMUIProps(props), props.children),
   FormControlLabel: (props: any) => {
     const { control, label, ...otherProps } = props;
     const children = [];
     if (control) children.push(React.cloneElement(control, { key: 'control' }));
     if (label) children.push(React.createElement('span', { key: 'label' }, label));
     return React.createElement('label', filterMUIProps(otherProps), children);
   },

  // Layout
  Divider: (props: any) => React.createElement('hr', filterMUIProps(props)),

  // Navigation
  Tabs: (props: any) => React.createElement('div', filterMUIProps(props), props.children),
  Tab: (props: any) => React.createElement('button', filterMUIProps(props), props.children),

  // Surfaces
  AppBar: (props: any) => React.createElement('header', filterMUIProps(props), props.children),
  Toolbar: (props: any) => React.createElement('div', filterMUIProps(props), props.children),

   // Utils
   ClickAwayListener: ({ children, ...props }: any) => React.createElement(React.Fragment, filterMUIProps(props), children),
   Portal: ({ children, ...props }: any) => React.createElement(React.Fragment, filterMUIProps(props), children),
   useMediaQuery: (_query: string) => false, // Mock always returns false

   // MUI v7 specific components
   Accordion: (props: any) => React.createElement('div', { ...filterMUIProps(props), 'data-testid': 'accordion' }, props.children),
   AccordionSummary: (props: any) => React.createElement('div', { ...filterMUIProps(props), 'data-testid': 'accordion-summary' }, props.children),
   AccordionDetails: (props: any) => React.createElement('div', { ...filterMUIProps(props), 'data-testid': 'accordion-details' }, props.children),
   Snackbar: (props: any) => React.createElement('div', { ...filterMUIProps(props), 'data-testid': 'snackbar' }, props.children),

  // Styles
  styled: (component: any) => (_styles: any) => component,
  useTheme: () => mockTheme,
};

// MUI Styles mocks
export const muiStyles = {
  createTheme,
  ThemeProvider,
  styled: (component: any) => (_styles: any) => component,
  useTheme: () => mockTheme,
  useMediaQuery: (_query: string) => {
    // Simple mock - return false for breakpoint queries in tests
    return false;
  },
  unstable_getUnit: (value: string | number) => {
    if (typeof value === 'string') {
      const match = value.match(/^(\d+)(px|rem|em|vh|vw|%)$/);
      return match ? match[2] : 'px';
    }
    return 'px';
  },
  default: {
    createTheme,
    ThemeProvider,
    styled: (component: any) => (_styles: any) => component,
    useTheme: () => mockTheme,
    useMediaQuery: (_query: string) => {
      // Simple mock - return false for breakpoint queries in tests
      return false;
    },
    unstable_getUnit: (value: string | number) => {
      if (typeof value === 'string') {
        const match = value.match(/^(\d+)(px|rem|em|vh|vw|%)$/);
        return match ? match[2] : 'px';
      }
      return 'px';
    },
  },
};

// Icon mocks
export const iconMocks = {
  // Add common icons as needed
  Home: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Home' }),
  Settings: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Settings' }),
  Dashboard: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Dashboard' }),
  Monitor: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Monitor' }),
  Memory: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Memory' }),
  Description: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Description' }),
  Refresh: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Refresh' }),
  Save: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Save' }),
  CheckCircle: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'CheckCircle' }),
  ErrorOutline: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'ErrorOutline' }),
  Rocket: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Rocket' }),
  Warning: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Warning' }),
};

