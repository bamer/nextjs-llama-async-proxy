import React from 'react';

// List of MUI-specific props to filter out from DOM
const muiProps = [
  'sx', 'mt', 'mb', 'ml', 'mr', 'my', 'mx', 'pt', 'pb', 'pl', 'pr', 'py', 'px', 'p', 'm',
  'gap', 'flex', 'justifyContent', 'alignItems', 'display', 'height', 'width', 'fullWidth',
  'centered', 'size', 'variant', 'color', 'disabled', 'gutterBottom', 'subheader', 'title',
  'position', 'zIndex', 'overflow', 'textAlign', 'primaryTypographyProps', 'disablePadding',
  'dense', 'component', 'href', 'to', 'noWrap', 'align', 'elevation', 'square', 'spacing',
  'direction', 'container', 'item', 'xs', 'sm', 'md', 'lg', 'xl', 'onClose', 'open',
  'anchorEl', 'anchorOrigin', 'transformOrigin', 'getContentAnchorEl', 'PaperProps',
  'MenuListProps', 'onClick', 'primary', 'secondary', 'error', 'warning', 'info', 'success',
  'severity', 'icon', 'onExited', 'in', 'timeout', 'unmountOnExit', 'appear', 'startIcon',
  'endIcon', 'fullWidth', 'orientation', 'value', 'onChange', 'children', 'label',
];

const filterMUIProps = (props: any) => {
  const filtered: any = {};
  Object.keys(props).forEach(key => {
    if (!muiProps.includes(key) && !key.startsWith('data-') && !key.startsWith('aria-')) {
      filtered[key] = props[key];
    }
  });
  return filtered;
};

// Box - basic container
const MockBox = ({ children, ...props }: any) =>
  React.createElement('div', { ...filterMUIProps(props), className: 'MuiBox-root' }, children);

// Grid - responsive layout container
const MockGrid = ({ children, size, ...props }: any) =>
  React.createElement('div', {
    ...filterMUIProps(props),
    className: 'MuiGrid-root',
    'data-testid': props['data-testid'],
  }, children);

// Typography - text display
const MockTypography = ({ children, variant, gutterBottom, ...props }: any) =>
  React.createElement('span', {
    ...filterMUIProps(props),
    className: `MuiTypography-root MuiTypography-${variant || 'body1'}${gutterBottom ? ' MuiTypography-gutterBottom' : ''}`,
  }, children);

// Button - clickable button
const MockButton = ({ children, startIcon, endIcon, disabled, variant, ...props }: any) =>
  React.createElement('button', {
    ...filterMUIProps(props),
    className: `MuiButton-root MuiButton-${variant || 'text'}`,
    disabled,
    type: props.type || 'button',
  }, startIcon, children, endIcon);

// Card - card container
const MockCard = ({ children, ...props }: any) =>
  React.createElement('div', { ...filterMUIProps(props), className: 'MuiCard-root' }, children);

// CardContent - card inner content
const MockCardContent = ({ children, ...props }: any) =>
  React.createElement('div', { ...filterMUIProps(props), className: 'MuiCardContent-root' }, children);

// CardHeader - card header with title/subheader
const MockCardHeader = ({ title, subheader, avatar, ...props }: any) =>
  React.createElement('div', { ...filterMUIProps(props), className: 'MuiCardHeader-root' },
    avatar && React.createElement('div', { className: 'MuiCardHeader-avatar' }, avatar),
    React.createElement('div', { className: 'MuiCardHeader-content' },
      title && React.createElement('div', { className: 'MuiCardHeader-title' }, title),
      subheader && React.createElement('div', { className: 'MuiCardHeader-subheader' }, subheader)
    )
  );

// CardActions - card action buttons container
const MockCardActions = ({ children, ...props }: any) =>
  React.createElement('div', { ...filterMUIProps(props), className: 'MuiCardActions-root' }, children);

// TextField - text input field
const MockTextField = ({ label, value, onChange, disabled, fullWidth, type, ...props }: any) =>
  React.createElement('div', { className: 'MuiTextField-root' },
    label && React.createElement('label', { className: 'MuiFormLabel-root' }, label),
    React.createElement('input', {
      ...filterMUIProps(props),
      type: type || 'text',
      value,
      onChange,
      disabled,
      style: { width: fullWidth ? '100%' : 'auto' }
    })
  );

// Switch - toggle switch
const MockSwitch = ({ checked, onChange, disabled, ...props }: any) =>
  React.createElement('input', {
    ...filterMUIProps(props),
    type: 'checkbox',
    checked,
    onChange,
    disabled,
    role: 'switch',
  });

// IconButton - icon button
const MockIconButton = ({ children, disabled, ...props }: any) =>
  React.createElement('button', {
    ...filterMUIProps(props),
    className: 'MuiIconButton-root',
    disabled,
    type: 'button',
  }, children);

// AppBar - top application bar
const MockAppBar = ({ children, position, ...props }: any) =>
  React.createElement('header', {
    ...filterMUIProps(props),
    className: 'MuiAppBar-root',
    role: 'banner',
  }, children);

// Toolbar - toolbar container inside AppBar
const MockToolbar = ({ children, ...props }: any) =>
  React.createElement('div', { ...filterMUIProps(props), className: 'MuiToolbar-root' }, children);

// Tooltip - tooltip wrapper
const MockTooltip = ({ title, children, ...props }: any) =>
  React.createElement('div', { ...filterMUIProps(props), title, className: 'MuiTooltip-root' }, children);

// Divider - horizontal line
const MockDivider = (props: any) =>
  React.createElement('hr', { ...filterMUIProps(props), className: 'MuiDivider-root' });

// List - list container
const MockList = ({ children, dense, ...props }: any) =>
  React.createElement('ul', {
    ...filterMUIProps(props),
    className: `MuiList-root${dense ? ' MuiList-dense' : ''}`,
    role: 'list',
  }, children);

// ListItem - single list item
const MockListItem = ({ children, dense, ...props }: any) =>
  React.createElement('li', {
    ...filterMUIProps(props),
    className: `MuiListItem-root${dense ? ' MuiListItem-dense' : ''}`,
    role: 'listitem',
  }, children);

// ListItemButton - clickable list item
const MockListItemButton = ({ children, onClick, href, to, selected, ...props }: any) => {
  const element = href ? 'a' : 'button';
  return React.createElement(element, {
    ...filterMUIProps(props),
    className: `MuiListItemButton-root${selected ? ' Mui-selected' : ''}`,
    onClick,
    href,
    role: href || to ? 'link' : 'button',
  }, children);
};

// ListItemIcon - icon in list item
const MockListItemIcon = ({ children, ...props }: any) =>
  React.createElement('span', {
    ...filterMUIProps(props),
    className: 'MuiListItemIcon-root',
    role: 'img',
  }, children);

// ListItemText - text in list item
const MockListItemText = ({ primary, secondary, ...props }: any) =>
  React.createElement('span', { ...filterMUIProps(props), className: 'MuiListItemText-root' },
    primary && React.createElement('span', { className: 'MuiListItemText-primary' }, primary),
    secondary && React.createElement('span', { className: 'MuiListItemText-secondary' }, secondary)
  );

// CircularProgress - circular loading indicator
const MockCircularProgress = (props: any) =>
  React.createElement('div', {
    ...filterMUIProps(props),
    className: 'MuiCircularProgress-root',
    role: 'progressbar',
  });

// LinearProgress - linear loading bar
const MockLinearProgress = (props: any) =>
  React.createElement('div', {
    ...filterMUIProps(props),
    className: 'MuiLinearProgress-root',
    role: 'progressbar',
    style: { width: '100%', height: '4px', backgroundColor: '#e0e0e0' }
  });

// Alert - alert message
const MockAlert = ({ severity, children, ...props }: any) =>
  React.createElement('div', {
    ...filterMUIProps(props),
    className: `MuiAlert-root MuiAlert-${severity || 'info'}`,
    role: 'alert',
  }, children);

// Tabs - tab navigation
const MockTabs = ({ value, onChange, children, ...props }: any) =>
  React.createElement('div', {
    ...filterMUIProps(props),
    className: 'MuiTabs-root',
    role: 'tablist',
  }, children);

// Tab - single tab
const MockTab = ({ label, value, onClick, selected, ...props }: any) =>
  React.createElement('button', {
    ...filterMUIProps(props),
    className: `MuiTab-root${selected ? ' Mui-selected' : ''}`,
    role: 'tab',
    onClick,
    'aria-selected': selected,
  }, label);

// Select - select dropdown
const MockSelect = ({ value, onChange, children, ...props }: any) =>
  React.createElement('select', {
    ...filterMUIProps(props),
    value,
    onChange,
    className: 'MuiSelect-root',
  }, children);

// MenuItem - select option
const MockMenuItem = ({ value, children, onClick, ...props }: any) =>
  React.createElement('option', {
    ...filterMUIProps(props),
    value,
    onClick,
  }, children);

// Slider - range slider
const MockSlider = (props: any) =>
  React.createElement('input', {
    ...filterMUIProps(props),
    type: 'range',
    className: 'MuiSlider-root',
  });

// FormControl - form control wrapper
const MockFormControl = ({ children, ...props }: any) =>
  React.createElement('fieldset', {
    ...filterMUIProps(props),
    className: 'MuiFormControl-root',
  }, children);

// InputLabel - form input label
const MockInputLabel = ({ children, ...props }: any) =>
  React.createElement('label', { ...filterMUIProps(props), className: 'MuiInputLabel-root' }, children);

// FormControlLabel - control with label
const MockFormControlLabel = ({ label, control, ...props }: any) =>
  React.createElement('label', { ...filterMUIProps(props), className: 'MuiFormControlLabel-root' },
    control,
    label && React.createElement('span', {}, label)
  );

// Chip - small badge/chip element
const MockChip = ({ label, onDelete, onClick, ...props }: any) =>
  React.createElement('div', {
    ...filterMUIProps(props),
    className: 'MuiChip-root',
    onClick,
    role: 'button',
  },
    label,
    onDelete && React.createElement('button', { onClick: onDelete, className: 'MuiChip-deleteIcon' }, '×')
  );

// Collapse - collapsible content
const MockCollapse = ({ in: open, children, ...props }: any) =>
  open ? React.createElement('div', { ...filterMUIProps(props), className: 'MuiCollapse-root' }, children) : null;

// Drawer - side drawer
const MockDrawer = ({ open, onClose, children, anchor, ...props }: any) =>
  open ? React.createElement('div', {
    ...filterMUIProps(props),
    className: `MuiDrawer-root MuiDrawer-${anchor || 'left'}`,
    onClick: onClose,
  }, children) : null;

// Accordion - expandable accordion
const MockAccordion = ({ children, ...props }: any) =>
  React.createElement('details', { ...filterMUIProps(props), className: 'MuiAccordion-root' }, children);

// AccordionSummary - accordion header
const MockAccordionSummary = ({ children, expandIcon, ...props }: any) =>
  React.createElement('summary', { ...filterMUIProps(props), className: 'MuiAccordionSummary-root' },
    children,
    expandIcon
  );

// AccordionDetails - accordion content
const MockAccordionDetails = ({ children, ...props }: any) =>
  React.createElement('div', { ...filterMUIProps(props), className: 'MuiAccordionDetails-root' }, children);

// Paper - paper surface
const MockPaper = ({ children, elevation, square, ...props }: any) =>
  React.createElement('div', {
    ...filterMUIProps(props),
    className: `MuiPaper-root MuiPaper-elevation${elevation || 1}${square ? ' MuiPaper-rounded' : ''}`,
  }, children);

// Container - max-width container
const MockContainer = ({ children, maxWidth, ...props }: any) =>
  React.createElement('div', {
    ...filterMUIProps(props),
    className: `MuiContainer-root MuiContainer-${maxWidth || 'lg'}`,
  }, children);

// Stack - flexbox layout
const MockStack = ({ children, direction, spacing, ...props }: any) =>
  React.createElement('div', {
    ...filterMUIProps(props),
    className: 'MuiStack-root',
    style: { display: 'flex', flexDirection: direction || 'column', gap: spacing || 0 },
  }, children);

// Theme components
const MockThemeProvider = ({ children, theme, ...props }: any) =>
  React.createElement('div', { ...filterMUIProps(props), className: 'MuiThemeProvider-root' }, children);

const MockCssBaseline = (props: any) =>
  React.createElement('div', { ...filterMUIProps(props), className: 'MuiCssBaseline' });

// Mock createTheme function
const createTheme = (theme: any) => ({ ...theme, _isMock: true });

export const muiStyles = {
  ThemeProvider: MockThemeProvider,
  createTheme,
  responsiveFontSizes: (theme: any) => theme,
};

export const muiMocks = {
  Box: MockBox,
  Grid: MockGrid,
  Typography: MockTypography,
  Button: MockButton,
  Card: MockCard,
  CardContent: MockCardContent,
  CardHeader: MockCardHeader,
  CardActions: MockCardActions,
  TextField: MockTextField,
  Switch: MockSwitch,
  IconButton: MockIconButton,
  AppBar: MockAppBar,
  Toolbar: MockToolbar,
  Tooltip: MockTooltip,
  Divider: MockDivider,
  List: MockList,
  ListItem: MockListItem,
  ListItemButton: MockListItemButton,
  ListItemIcon: MockListItemIcon,
  ListItemText: MockListItemText,
  CircularProgress: MockCircularProgress,
  LinearProgress: MockLinearProgress,
  Alert: MockAlert,
  Tabs: MockTabs,
  Tab: MockTab,
  Select: MockSelect,
  MenuItem: MockMenuItem,
  Slider: MockSlider,
  FormControl: MockFormControl,
  InputLabel: MockInputLabel,
  FormControlLabel: MockFormControlLabel,
  Chip: MockChip,
  Collapse: MockCollapse,
  Drawer: MockDrawer,
  Accordion: MockAccordion,
  AccordionSummary: MockAccordionSummary,
  AccordionDetails: MockAccordionDetails,
  Paper: MockPaper,
  Container: MockContainer,
  Stack: MockStack,
  CssBaseline: MockCssBaseline,
  ThemeProvider: MockThemeProvider,
  useMediaQuery: jest.fn(() => false),
};

// Icon mocks
const iconNames = [
  'Rocket', 'Dashboard', 'ModelTraining', 'Monitor', 'Settings',
  'BarChart', 'Code', 'Cloud', 'Terminal', 'Menu', 'Close',
  'ChevronLeft', 'ChevronRight', 'ExpandMore', 'ExpandLess',
  'Brightness4', 'Brightness7', 'Refresh', 'Delete', 'Edit',
  'Add', 'PlayArrow', 'Stop', 'Warning', 'CheckCircle',
  'Error', 'Info', 'Speed', 'Memory', 'Storage',
  'NetworkCheck', 'SettingsEthernet', 'TrendingUp', 'TrendingDown',
  'MoreVert', 'Home', 'FileText', 'Bot', 'X',
];

const iconMocks: any = {};
iconNames.forEach(icon => {
  iconMocks[icon] = (props: any) =>
    React.createElement('svg', {
      ...props,
      'data-icon': icon,
      className: `MuiSvgIcon-root MuiIcon-${icon} ${props.className || ''}`,
      role: 'img',
      'aria-label': props['aria-label'] || icon,
      viewBox: '0 0 24 24',
      width: props.width || '1em',
      height: props.height || '1em',
    }, React.createElement('path', { d: 'M0 0h24v24H0z' }));
});

export { iconMocks };
