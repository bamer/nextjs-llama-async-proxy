import '@testing-library/jest-dom';
import React from 'react';
import {
  ModelsPage,
  LogsPage,
  ConfigurationPage,
  MonitoringPage
} from '@/components/pages';

jest.mock('@/components/pages/ModelsPage', () => ({
  ModelsPage: () => React.createElement('div', { 'data-testid': 'models-page' }, 'Models Page'),
}));

jest.mock('@/components/pages/LogsPage', () => ({
  default: () => React.createElement('div', { 'data-testid': 'logs-page' }, 'Logs Page'),
}));

jest.mock('@/components/pages/ConfigurationPage', () => ({
  ConfigurationPage: () => React.createElement('div', { 'data-testid': 'configuration-page' }, 'Configuration Page'),
}));

jest.mock('@/components/pages/MonitoringPage', () => ({
  MonitoringPage: () => React.createElement('div', { 'data-testid': 'monitoring-page' }, 'Monitoring Page'),
}));

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

  describe('Component Structure', () => {
    it('ModelsPage is a valid React component type', () => {
      const isValidComponent = React.isValidElement(React.createElement(ModelsPage));
      expect(isValidComponent).toBe(true);
    });

    it('LogsPage is a valid React component type', () => {
      const isValidComponent = React.isValidElement(React.createElement(LogsPage));
      expect(isValidComponent).toBe(true);
    });

    it('ConfigurationPage is a valid React component type', () => {
      const isValidComponent = React.isValidElement(React.createElement(ConfigurationPage));
      expect(isValidComponent).toBe(true);
    });

    it('MonitoringPage is a valid React component type', () => {
      const isValidComponent = React.isValidElement(React.createElement(MonitoringPage));
      expect(isValidComponent).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('maintains exports after re-import', () => {
      const imports1 = require('@/components/pages');
      const imports2 = require('@/components/pages');

      expect(imports1.ModelsPage).toBeDefined();
      expect(imports2.ModelsPage).toBeDefined();
      expect(imports1.ModelsPage).toBe(imports2.ModelsPage);
    });

    it('handles multiple components being referenced', () => {
      const componentRefs = [ModelsPage, LogsPage, ConfigurationPage, MonitoringPage];

      componentRefs.forEach(component => {
        expect(component).toBeDefined();
        expect(component).toBeTruthy();
      });
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

    it('has no default export', () => {
      const exports = require('@/components/pages');

      expect(exports.default).toBeUndefined();
    });
  });

  describe('Import Patterns', () => {
    it('allows importing all components', () => {
      expect(() => {
        require('@/components/pages');
      }).not.toThrow();
    });

    it('allows importing individual components', () => {
      const { ModelsPage } = require('@/components/pages');
      const { LogsPage } = require('@/components/pages');
      const { ConfigurationPage } = require('@/components/pages');
      const { MonitoringPage } = require('@/components/pages');

      expect(ModelsPage).toBeDefined();
      expect(LogsPage).toBeDefined();
      expect(ConfigurationPage).toBeDefined();
      expect(MonitoringPage).toBeDefined();
    });

    it('allows importing via object destructuring', () => {
      const { ModelsPage, LogsPage, ConfigurationPage, MonitoringPage } =
        require('@/components/pages');

      expect(ModelsPage).toBeDefined();
      expect(LogsPage).toBeDefined();
      expect(ConfigurationPage).toBeDefined();
      expect(MonitoringPage).toBeDefined();
    });
  });
});
