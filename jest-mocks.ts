import React from 'react';

const MockBox = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockGrid = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockTypography = ({ children, ...props }: any) => React.createElement('span', props, children);
const MockButton = ({ children, ...props }: any) => React.createElement('button', props, children);
const MockCard = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockCardContent = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockCardHeader = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockCardActions = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockTextField = (props: any) => React.createElement('input', { type: 'text', ...props });
const MockSwitch = (props: any) => React.createElement('input', { type: 'checkbox', ...props });
const MockIconButton = ({ children, ...props }: any) => React.createElement('button', props, children);
const MockAppBar = ({ children, ...props }: any) => React.createElement('header', props, children);
const MockToolbar = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockTooltip = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockDivider = (props: any) => React.createElement('hr', props);
const MockList = ({ children, ...props }: any) => React.createElement('ul', props, children);
const MockListItem = ({ children, ...props }: any) => React.createElement('li', props, children);
const MockListItemText = ({ children, ...props }: any) => React.createElement('span', props, children);
const MockCircularProgress = (props: any) => React.createElement('div', props);
const MockAlert = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockTabs = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockTab = ({ children, ...props }: any) => React.createElement('button', props, children);
const MockSelect = ({ children, ...props }: any) => React.createElement('select', props, children);
const MockMenuItem = ({ children, ...props }: any) => React.createElement('option', props, children);
const MockSlider = (props: any) => React.createElement('input', { type: 'range', ...props });
const MockFormControl = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockInputLabel = ({ children, ...props }: any) => React.createElement('label', props, children);
const MockFormControlLabel = ({ children, ...props }: any) => React.createElement('label', props, children);
const MockChip = ({ children, ...props }: any) => React.createElement('span', props, children);
const MockCollapse = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockDrawer = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockAccordion = ({ children, ...props }: any) => React.createElement('details', props, children);
const MockAccordionSummary = ({ children, ...props }: any) => React.createElement('summary', props, children);
const MockAccordionDetails = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockPaper = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockContainer = ({ children, ...props }: any) => React.createElement('div', props, children);
const MockStack = ({ children, ...props }: any) => React.createElement('div', props, children);

// Mock MuiThemeProvider (wraps children with a div)
const MockMuiThemeProvider = ({ children, ...props }: any) => React.createElement('div', props, children);
// Mock CssBaseline (renders nothing, just a div)
const MockCssBaseline = (props: any) => React.createElement('div', props);

// Mock createTheme function
const createTheme = (theme: any) => ({ ...theme, _isMock: true });

export const muiStyles = {
  ThemeProvider: MockMuiThemeProvider,
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
  ListItemText: MockListItemText,
  CircularProgress: MockCircularProgress,
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
  // Mock useMediaQuery hook
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
];

const iconMocks: any = {};
iconNames.forEach(icon => {
  iconMocks[icon] = () => React.createElement('span', { 'data-icon': icon });
});

export { iconMocks };
