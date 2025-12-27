import React from 'react';

const muiProps = ['sx', 'mt', 'mb', 'ml', 'mr', 'my', 'mx', 'pt', 'pb', 'pl', 'pr', 'py', 'px', 'p', 'm', 'gap', 'flex', 'justifyContent', 'alignItems', 'display', 'height', 'width', 'fullWidth', 'centered', 'size', 'variant', 'color', 'disabled', 'gutterBottom', 'subheader', 'title', 'position', 'zIndex', 'overflow', 'textAlign'];

const filterMUIProps = (props: any) => {
  const filtered: any = {};
  Object.keys(props).forEach(key => {
    if (!muiProps.includes(key)) {
      filtered[key] = props[key];
    }
  });
  return filtered;
};

const MockBox = ({ children, ...props }: any) => React.createElement('div', filterMUIProps(props), children);
const MockGrid = ({ children, ...props }: any) => React.createElement('div', filterMUIProps({ ...props, className: props.className || 'MuiGrid-root' }), children);
const MockTypography = ({ children, ...props }: any) => React.createElement('span', filterMUIProps(props), children);
const MockButton = ({ children, startIcon, ...props }: any) => React.createElement('button', filterMUIProps({ ...props, className: props.className || 'MuiButton-root' }), startIcon, children);
const MockCard = ({ children, ...props }: any) => React.createElement('div', filterMUIProps({ ...props, className: props.className || 'MuiCard-root' }), children);
const MockCardContent = ({ children, ...props }: any) => React.createElement('div', filterMUIProps({ ...props, className: props.className || 'MuiCardContent-root' }), children);
const MockCardHeader = ({ children, title, subheader, ...props }: any) => React.createElement('div', filterMUIProps({ ...props, className: props.className || 'MuiCardHeader-root' }), title && React.createElement('div', {}, title), subheader && React.createElement('div', {}, subheader), children);
const MockCardActions = ({ children, ...props }: any) => React.createElement('div', filterMUIProps({ ...props, className: props.className || 'MuiCardActions-root' }), children);
const MockTextField = ({ children, ...props }: any) => React.createElement('div', filterMUIProps({ ...props, className: props.className || 'MuiTextField-root' }), children);
const MockSwitch = (props: any) => React.createElement('input', { type: 'checkbox', ...filterMUIProps(props) });
const MockIconButton = ({ children, ...props }: any) => React.createElement('button', filterMUIProps({ ...props, className: props.className || 'MuiIconButton-root' }), children);
const MockAppBar = ({ children, ...props }: any) => React.createElement('header', filterMUIProps(props), children);
const MockToolbar = ({ children, ...props }: any) => React.createElement('div', filterMUIProps(props), children);
const MockTooltip = ({ children, ...props }: any) => React.createElement('div', filterMUIProps(props), children);
const MockDivider = (props: any) => React.createElement('hr', filterMUIProps(props));
const MockList = ({ children, ...props }: any) => React.createElement('ul', filterMUIProps(props), children);
const MockListItem = ({ children, ...props }: any) => React.createElement('li', filterMUIProps(props), children);
const MockListItemButton = ({ children, ...props }: any) => React.createElement('button', filterMUIProps({ ...props, className: props.className || 'MuiListItemButton-root' }), children);
const MockListItemIcon = ({ children, ...props }: any) => React.createElement('span', filterMUIProps({ ...props, className: props.className || 'MuiListItemIcon-root' }), children);
const MockListItemText = ({ children, ...props }: any) => React.createElement('span', filterMUIProps(props), children);
const MockCircularProgress = (props: any) => React.createElement('div', filterMUIProps(props));
const MockLinearProgress = (props: any) => React.createElement('div', { ...filterMUIProps(props), role: 'progressbar', style: { width: '100%', height: '4px', backgroundColor: '#e0e0e0' } });
const MockAlert = ({ children, ...props }: any) => React.createElement('div', filterMUIProps(props), children);
const MockTabs = ({ children, ...props }: any) => React.createElement('div', filterMUIProps(props), children);
const MockTab = ({ children, ...props }: any) => React.createElement('button', filterMUIProps(props), children);
const MockSelect = ({ children, ...props }: any) => React.createElement('select', filterMUIProps(props), children);
const MockMenuItem = ({ children, ...props }: any) => React.createElement('option', filterMUIProps(props), children);
const MockSlider = (props: any) => React.createElement('input', { type: 'range', ...filterMUIProps(props) });
const MockFormControl = ({ children, ...props }: any) => React.createElement('div', filterMUIProps(props), children);
const MockInputLabel = ({ children, ...props }: any) => React.createElement('label', filterMUIProps(props), children);
const MockFormControlLabel = ({ children, ...props }: any) => React.createElement('label', filterMUIProps(props), children);
const MockChip = ({ label, children, ...props }: any) => React.createElement('span', filterMUIProps(props), label || children);
const MockCollapse = ({ children, ...props }: any) => React.createElement('div', filterMUIProps(props), children);
const MockDrawer = ({ children, ...props }: any) => React.createElement('div', filterMUIProps(props), children);
const MockAccordion = ({ children, ...props }: any) => React.createElement('details', props, children);
const MockAccordionSummary = ({ children, ...props }: any) => React.createElement('summary', props, children);
const MockAccordionDetails = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockPaper = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockContainer = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockStack = ({ children, ...props }: any) => React.createElement('div', props, children);

const MockThemeProvider = ({ children, theme, ...props }: any) => React.createElement('div', props, children);
const MockCssBaseline = (props: any) => React.createElement('div', props);

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

const iconNames = [
  'Rocket', 'Dashboard', 'ModelTraining', 'Monitor', 'Settings',
  'BarChart', 'Code', 'Cloud', 'Terminal', 'Menu', 'Close',
  'ChevronLeft', 'ChevronRight', 'ExpandMore', 'ExpandLess',
  'Brightness4', 'Brightness7', 'Refresh', 'Delete', 'Edit',
  'Add', 'PlayArrow', 'Stop', 'Warning', 'CheckCircle',
  'Error', 'Info', 'Speed', 'Memory', 'Storage',
  'NetworkCheck', 'SettingsEthernet', 'TrendingUp', 'TrendingDown',
  'MoreVert',
];

const iconMocks: any = {};
iconNames.forEach(icon => {
  iconMocks[icon] = () => React.createElement('span', { 'data-icon': icon });
});

export { iconMocks };
