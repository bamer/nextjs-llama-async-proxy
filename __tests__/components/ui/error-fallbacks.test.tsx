import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import {
  DashboardFallback,
  MonitoringFallback,
  ModelsFallback,
  LogsFallback,
  SettingsFallback
} from '@/components/ui/error-fallbacks';

describe('Error Fallback Components', () => {
  describe('DashboardFallback', () => {
    it('renders correctly', () => {
      render(<DashboardFallback />);

      expect(screen.getByText('Dashboard Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Reload Dashboard')).toBeInTheDocument();
    });

    it('displays correct message', () => {
      render(<DashboardFallback />);

      expect(screen.getByText('We encountered an error while loading the dashboard. Please try again.')).toBeInTheDocument();
    });
  });

  describe('MonitoringFallback', () => {
    it('renders correctly', () => {
      render(<MonitoringFallback />);

      expect(screen.getByText('Monitoring Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Reload Monitoring')).toBeInTheDocument();
    });

    it('displays correct message', () => {
      render(<MonitoringFallback />);

      expect(screen.getByText('We encountered an error while loading system monitoring. Please try again.')).toBeInTheDocument();
    });
  });

  describe('ModelsFallback', () => {
    it('renders correctly', () => {
      render(<ModelsFallback />);

      expect(screen.getByText('Models Management Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Reload Models')).toBeInTheDocument();
    });

    it('displays correct message', () => {
      render(<ModelsFallback />);

      expect(screen.getByText('We encountered an error while loading the models page. Please try again.')).toBeInTheDocument();
    });
  });

  describe('LogsFallback', () => {
    it('renders correctly', () => {
      render(<LogsFallback />);

      expect(screen.getByText('Logs Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Reload Logs')).toBeInTheDocument();
    });

    it('displays correct message', () => {
      render(<LogsFallback />);

      expect(screen.getByText('We encountered an error while loading the logs. Please try again.')).toBeInTheDocument();
    });
  });

  describe('SettingsFallback', () => {
    it('renders correctly', () => {
      render(<SettingsFallback />);

      expect(screen.getByText('Settings Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Reload Settings')).toBeInTheDocument();
    });

    it('displays correct message', () => {
      render(<SettingsFallback />);

      expect(screen.getByText('We encountered an error while loading the settings. Please try again.')).toBeInTheDocument();
    });
  });

  it('all fallback components render without errors', () => {
    expect(() => {
      render(
        <div>
          <DashboardFallback />
          <MonitoringFallback />
          <ModelsFallback />
          <LogsFallback />
          <SettingsFallback />
        </div>
      );
    }).not.toThrow();
  });
});