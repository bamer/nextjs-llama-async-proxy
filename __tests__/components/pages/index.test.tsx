import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  ModelsPage,
  LogsPage,
  ConfigurationPage,
  MonitoringPage
} from '@/components/pages';

jest.mock('@/components/pages/ModelsPage', () => ({
  ModelsPage: () => <div data-testid="models-page">Models Page</div>,
}));

jest.mock('@/components/pages/LogsPage', () => ({
  default: () => <div data-testid="logs-page">Logs Page</div>,
}));

jest.mock('@/components/pages/ConfigurationPage', () => ({
  ConfigurationPage: () => <div data-testid="configuration-page">Configuration Page</div>,
}));

jest.mock('@/components/pages/MonitoringPage', () => ({
  MonitoringPage: () => <div data-testid="monitoring-page">Monitoring Page</div>,
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('Pages Index Exports', () => {
  describe('Component Exports', () => {
    it('exports ModelsPage component', () => {
      expect(ModelsPage).toBeDefined();
      expect(ModelsPage).toBeTruthy();
    });

    it('exports LogsPage component', () => {
      expect(LogsPage).toBeDefined();
      expect(LogsPage).toBeTruthy();
    });

    it('exports ConfigurationPage component', () => {
      expect(ConfigurationPage).toBeDefined();
      expect(ConfigurationPage).toBeTruthy();
    });

    it('exports MonitoringPage component', () => {
      expect(MonitoringPage).toBeDefined();
      expect(MonitoringPage).toBeTruthy();
    });
  });

  describe('Component Rendering', () => {
    it('ModelsPage can be rendered', () => {
      renderWithTheme(<ModelsPage />);
      expect(screen.getByTestId('models-page')).toBeInTheDocument();
    });

    it('LogsPage can be rendered', () => {
      renderWithTheme(<LogsPage />);
      expect(screen.getByTestId('logs-page')).toBeInTheDocument();
    });

    it('ConfigurationPage can be rendered', () => {
      renderWithTheme(<ConfigurationPage />);
      expect(screen.getByTestId('configuration-page')).toBeInTheDocument();
    });

    it('MonitoringPage can be rendered', () => {
      renderWithTheme(<MonitoringPage />);
      expect(screen.getByTestId('monitoring-page')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles multiple components rendering together', () => {
      renderWithTheme(
        <>
          <ModelsPage />
          <LogsPage />
          <ConfigurationPage />
          <MonitoringPage />
        </>
      );

      expect(screen.getByTestId('models-page')).toBeInTheDocument();
      expect(screen.getByTestId('logs-page')).toBeInTheDocument();
      expect(screen.getByTestId('configuration-page')).toBeInTheDocument();
      expect(screen.getByTestId('monitoring-page')).toBeInTheDocument();
    });

    it('handles components with props', () => {
      const TestComponent = () => <div>Test</div>;

      renderWithTheme(
        <>
          <ModelsPage />
          <LogsPage />
          <ConfigurationPage />
          <MonitoringPage />
          <TestComponent />
        </>
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('maintains exports after re-import', () => {
      const imports1 = require('@/components/pages');
      const imports2 = require('@/components/pages');

      expect(imports1.ModelsPage).toBeDefined();
      expect(imports2.ModelsPage).toBeDefined();
      expect(imports1.ModelsPage).toBe(imports2.ModelsPage);
    });
  });

  describe('Export Consistency', () => {
    it('exports all expected page components', () => {
      const exports = require('@/components/pages');

      expect(Object.keys(exports)).toContain('ModelsPage');
      expect(Object.keys(exports)).toContain('LogsPage');
      expect(Object.keys(exports)).toContain('ConfigurationPage');
      expect(Object.keys(exports)).toContain('MonitoringPage');
    });

    it('exports components as named exports', () => {
      const { ModelsPage, LogsPage, ConfigurationPage, MonitoringPage } =
        require('@/components/pages');

      expect(ModelsPage).toBeDefined();
      expect(LogsPage).toBeDefined();
      expect(ConfigurationPage).toBeDefined();
      expect(MonitoringPage).toBeDefined();
    });

    it('exports do not contain unexpected properties', () => {
      const exports = Object.keys(require('@/components/pages'));

      const expectedExports = ['ModelsPage', 'LogsPage', 'ConfigurationPage', 'MonitoringPage'];

      exports.forEach(exp => {
        expect(expectedExports).toContain(exp);
      });
    });
  });
});
