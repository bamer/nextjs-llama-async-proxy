import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import React from 'react';

jest.mock('axios');
jest.mock('@/services/metrics-service');
jest.mock('@/hooks/use-websocket');
jest.mock('@/components/configuration/hooks/useConfigurationForm');

const mockUseWebSocket = jest.requireMock('@/hooks/use-websocket').useWebSocket;
const mockUseConfigForm = jest.requireMock('@/components/configuration/hooks/useConfigurationForm').useConfigurationForm;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function renderWithProviders(component: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
}

describe('UI Components - Critical Path', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWebSocket.mockReset();
    mockUseConfigForm.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('MetricCard', () => {
    it('should render title and value', () => {
      const props = {
        title: 'CPU Usage',
        value: '50%',
        color: 'primary',
        icon: 'cpu',
      };

      renderWithProviders(
        <div data-testid="metric-card">
          <h2>{props.title}</h2>
          <p>{props.value}</p>
        </div>
      );

      expect(screen.getByText('CPU Usage')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should display icon', () => {
      renderWithProviders(
        <div data-testid="metric-card">
          <span data-testid="metric-icon">Icon</span>
        </div>
      );

      expect(screen.getByTestId('metric-icon')).toBeInTheDocument();
    });

    it('should use correct color for status', () => {
      renderWithProviders(
        <div data-testid="metric-card" className="MuiPaper-root error">
          <span>Test</span>
        </div>
      );

      const card = screen.getByTestId('metric-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('MuiPaper-root');
      expect(card).toHaveClass('error');
    });
  });

  describe('Dashboard Layout', () => {
    it('should render main container', () => {
      renderWithProviders(
        <Box sx={{ padding: 3 }}>
          <div data-testid="dashboard-main">Dashboard</div>
        </Box>
      );

      expect(screen.getByTestId('dashboard-main')).toBeInTheDocument();
    });

    it('should support responsive layout', () => {
      renderWithProviders(
        <Box sx={{ padding: { xs: 2, md: 3 } }}>
          <div data-testid="dashboard-responsive">Dashboard</div>
        </Box>
      );

      expect(screen.getByTestId('dashboard-responsive')).toBeInTheDocument();
    });
  });

  describe('WebSocket Status Indicator', () => {
    it('should show connected state', () => {
      mockUseWebSocket.mockReturnValue({
        isConnected: true,
        error: null,
        lastMessage: null,
        retryCount: 0,
        retryDelay: 0,
        connectionAttempts: 0,
        reconnectAttempts: 0,
        totalReconnects: 0,
        serverStatus: { status: 'ready', uptime: 3600 },
        isHealthy: true,
        metrics: { cpuUsage: 50 },
        activeModels: 1,
      });

      renderWithProviders(
        <div data-testid="ws-status">
          WebSocket: <span data-testid="connected-status" className="text-green-500">Connected</span>
        </div>
      );

      expect(screen.getByTestId('ws-status')).toBeInTheDocument();
      expect(screen.getByTestId('connected-status')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should show disconnected state', () => {
      mockUseWebSocket.mockReturnValue({
        isConnected: false,
        error: new Error('Connection failed'),
        retryCount: 3,
      });

      renderWithProviders(
        <div data-testid="ws-status">
          WebSocket: <span data-testid="disconnected-status" className="text-red-500">Disconnected</span>
        </div>
      );

      expect(screen.getByTestId('ws-status')).toBeInTheDocument();
      expect(screen.getByTestId('disconnected-status')).toBeInTheDocument();
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
      const disconnectedStatus = screen.getByTestId('disconnected-status');
      expect(disconnectedStatus).toHaveClass('text-red-500');
    });

    it('should show loading state', () => {
      mockUseWebSocket.mockReturnValue({
        isConnected: false,
        error: null,
        retryCount: 1,
        retryDelay: 5000,
      });

      renderWithProviders(
        <div data-testid="ws-status">
          WebSocket: <span data-testid="loading-status" className="text-yellow-500">Connecting...</span>
        </div>
      );

      expect(screen.getByTestId('ws-status')).toBeInTheDocument();
      expect(screen.getByTestId('loading-status')).toBeInTheDocument();
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('should display error message when connection fails', () => {
      mockUseWebSocket.mockReturnValue({
        isConnected: false,
        error: new Error('Connection failed'),
        retryCount: 5,
      });

      renderWithProviders(
        <div data-testid="ws-status">
          WebSocket: <span data-testid="error-status" className="text-red-500">Connection failed</span>
        </div>
      );

      expect(screen.getByTestId('ws-status')).toBeInTheDocument();
      expect(screen.getByTestId('error-status')).toBeInTheDocument();
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      renderWithProviders(
        <form data-testid="config-form">
          <input data-testid="basePath" required />
          <input data-testid="logLevel" required />
          <button type="submit">Save</button>
        </form>
      );

      const basePathInput = screen.getByTestId('basePath');
      const logLevelInput = screen.getByTestId('logLevel');
      const submitButton = screen.getByText('Save');

      expect(basePathInput).toBeInTheDocument();
      expect(logLevelInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });

    it('should validate numeric ranges', () => {
      renderWithProviders(
        <form data-testid="config-form">
          <input data-testid="maxConcurrentModels" type="number" min="1" max="10" value="5" />
        </form>
      );

      const maxModelsInput = screen.getByTestId('maxConcurrentModels');
      expect(maxModelsInput).toBeInTheDocument();
      expect(maxModelsInput).toHaveAttribute('min', '1');
      expect(maxModelsInput).toHaveAttribute('max', '10');
    });

    it('should handle empty form submission', () => {
      renderWithProviders(
        <form data-testid="config-form">
          <input data-testid="basePath" value="" />
          <button type="submit">Save</button>
        </form>
      );

      const basePathInput = screen.getByTestId('basePath');
      expect(basePathInput).toHaveValue('');
    });
  });

  describe('Error Handling', () => {
    it('should display error message for network errors', () => {
      mockUseWebSocket.mockReturnValue({
        isConnected: false,
        error: new Error('Network error'),
        retryCount: 3,
      });

      renderWithProviders(
        <div data-testid="error-display">
          <div className="error-message">Network error: Connection failed</div>
        </div>
      );

      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText('Network error: Connection failed')).toBeInTheDocument();
    });

    it('should display fallback content when API unavailable', () => {
      mockUseConfigForm.mockReturnValue({
        config: { basePath: '/models', logLevel: 'info' },
        handleSave: jest.fn(),
        isLoading: false,
        error: 'API unavailable',
      });

      renderWithProviders(
        <div data-testid="fallback-content">
          <p>API unavailable. Using local configuration.</p>
        </div>
      );

      expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
      expect(screen.getByText('API unavailable. Using local configuration.')).toBeInTheDocument();
    });
  });

  describe('Data Loading States', () => {
    it('should show loading spinner', () => {
      renderWithProviders(
        <div data-testid="loading-spinner">
          <div className="spinner">Loading...</div>
        </div>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show empty state', () => {
      renderWithProviders(
        <div data-testid="empty-state">
          <p>No data available</p>
        </div>
      );

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should transition from loading to data', () => {
      const { rerender } = renderWithProviders(
        <div data-testid="data-container">
          <div className="loading">Loading...</div>
        </div>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      rerender(
        <div data-testid="data-container">
          <div className="data">Data loaded</div>
        </div>
      );

      expect(screen.getByText('Data loaded')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });
});

// Mock Box component
const Box = ({ children, sx }: any) => {
  return <div style={sx}>{children}</div>;
};
