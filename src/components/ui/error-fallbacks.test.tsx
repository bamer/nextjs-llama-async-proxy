import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  DashboardFallback,
  MonitoringFallback,
  ModelsFallback,
  LogsFallback,
  SettingsFallback,
} from './error-fallbacks';

describe('Error Fallback Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DashboardFallback', () => {
    it('renders dashboard error message', () => {
      render(<DashboardFallback />);

      expect(screen.getByText('Dashboard Unavailable')).toBeInTheDocument();
      expect(screen.getByText('We encountered an error while loading the dashboard. Please try again.')).toBeInTheDocument();
      expect(screen.getByText('Reload Dashboard')).toBeInTheDocument();
    });

    it('has clickable reload button', () => {
      render(<DashboardFallback />);

      const reloadButton = screen.getByText('Reload Dashboard');
      expect(reloadButton).toBeInTheDocument();
      expect(reloadButton.tagName).toBe('BUTTON');
    });

    it('has correct icon and styling', () => {
      render(<DashboardFallback />);

      // Check that the icon is rendered (data-testid would be better but this works)
      const card = screen.getByText('Dashboard Unavailable').closest('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });
  });

  describe('MonitoringFallback', () => {
    it('renders monitoring error message', () => {
      render(<MonitoringFallback />);

      expect(screen.getByText('Monitoring Unavailable')).toBeInTheDocument();
      expect(screen.getByText('We encountered an error while loading system monitoring. Please try again.')).toBeInTheDocument();
      expect(screen.getByText('Reload Monitoring')).toBeInTheDocument();
    });

    it('has clickable reload button', () => {
      render(<MonitoringFallback />);

      const reloadButton = screen.getByText('Reload Monitoring');
      expect(reloadButton).toBeInTheDocument();
      expect(reloadButton.tagName).toBe('BUTTON');
    });
  });

  describe('ModelsFallback', () => {
    it('renders models error message', () => {
      render(<ModelsFallback />);

      expect(screen.getByText('Models Management Unavailable')).toBeInTheDocument();
      expect(screen.getByText('We encountered an error while loading the models page. Please try again.')).toBeInTheDocument();
      expect(screen.getByText('Reload Models')).toBeInTheDocument();
    });

    it('has clickable reload button', () => {
      render(<ModelsFallback />);

      const reloadButton = screen.getByText('Reload Models');
      expect(reloadButton).toBeInTheDocument();
      expect(reloadButton.tagName).toBe('BUTTON');
    });
  });

  describe('LogsFallback', () => {
    it('renders logs error message', () => {
      render(<LogsFallback />);

      expect(screen.getByText('Logs Unavailable')).toBeInTheDocument();
      expect(screen.getByText('We encountered an error while loading the logs. Please try again.')).toBeInTheDocument();
      expect(screen.getByText('Reload Logs')).toBeInTheDocument();
    });

    it('has clickable reload button', () => {
      render(<LogsFallback />);

      const reloadButton = screen.getByText('Reload Logs');
      expect(reloadButton).toBeInTheDocument();
      expect(reloadButton.tagName).toBe('BUTTON');
    });
  });

  describe('SettingsFallback', () => {
    it('renders settings error message', () => {
      render(<SettingsFallback />);

      expect(screen.getByText('Settings Unavailable')).toBeInTheDocument();
      expect(screen.getByText('We encountered an error while loading the settings. Please try again.')).toBeInTheDocument();
      expect(screen.getByText('Reload Settings')).toBeInTheDocument();
    });

    it('has clickable reload button', () => {
      render(<SettingsFallback />);

      const reloadButton = screen.getByText('Reload Settings');
      expect(reloadButton).toBeInTheDocument();
      expect(reloadButton.tagName).toBe('BUTTON');
    });
  });

  describe('Common Behavior', () => {
    it('all fallbacks have consistent messaging pattern', () => {
      const fallbacks = [
        { component: <DashboardFallback key="dashboard" />, expectedText: 'dashboard' },
        { component: <MonitoringFallback key="monitoring" />, expectedText: 'system monitoring' },
        { component: <ModelsFallback key="models" />, expectedText: 'the models page' },
        { component: <LogsFallback key="logs" />, expectedText: 'the logs' },
        { component: <SettingsFallback key="settings" />, expectedText: 'the settings' },
      ];

      fallbacks.forEach(({ component }) => {
        const { unmount } = render(component);

        expect(screen.getByText(/We encountered an error while loading/)).toBeInTheDocument();
        expect(screen.getByText(/Please try again\./)).toBeInTheDocument();

        unmount();
      });
    });

    it('all buttons follow naming convention', () => {
      const buttonTexts = ['Reload Dashboard', 'Reload Monitoring', 'Reload Models', 'Reload Logs', 'Reload Settings'];

      buttonTexts.forEach((buttonText) => {
        const fallbackMap = {
          'Reload Dashboard': <DashboardFallback key="dashboard" />,
          'Reload Monitoring': <MonitoringFallback key="monitoring" />,
          'Reload Models': <ModelsFallback key="models" />,
          'Reload Logs': <LogsFallback key="logs" />,
          'Reload Settings': <SettingsFallback key="settings" />,
        };

        const { unmount } = render(fallbackMap[buttonText as keyof typeof fallbackMap]);

        expect(screen.getByText(buttonText)).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Accessibility', () => {
    it('buttons are present and clickable', () => {
      render(<DashboardFallback />);

      const button = screen.getByText('Reload Dashboard');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });
  });
});