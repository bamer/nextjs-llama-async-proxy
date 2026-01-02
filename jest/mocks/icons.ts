import React from 'react';

// Import shared utilities from jest-mocks.ts
const { filterMUIProps, iconMocks } = require('../../jest-mocks');

// Mock MUI icons
jest.mock('@mui/icons-material', () => {
  const filterProps = (props: any) => {
    const { sx, ...filtered } = props;
    return filtered;
  };

  return iconMocks;
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