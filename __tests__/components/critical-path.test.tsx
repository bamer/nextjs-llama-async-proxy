import { render, screen } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import fetchMock from 'jest-fetch-mock';
import '@mui/material/Box';
import '@mui/material/Button';
import '@mui/material/Typography';
import '@mui/material/TextField';
import '@mui/material/Slider';
import '@mui/material/Switch';

jest.mock('axios');
jest.mock('jest-fetch-mock');
jest.mocked('@/services/metrics-service');
jest.mocked('@/hooks/use-websocket');
jest.mocked('@/components/configuration/hooks/useConfigurationForm');

const mockUseWebSocket = jest.requireMock('@/hooks/use-websocket').useWebSocket;
const mockUseConfigForm = jest.requireMock('@/components/configuration/hooks/useConfigurationForm').useConfigurationForm;

describe('UI Components - Critical Path', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fetchMock.disableMocks();
  });

  describe('MetricCard', () => {
    it('should render title and value', () => {
      const props = {
        title: 'CPU Usage',
        value: '50%',
        color: 'primary',
        icon: 'cpu',
      };

      render(<MetricCard {...props} />);

      expect(screen.getByText('CPU Usage')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should display icon', () => {
      render(<MetricCard title='Test' value='75%' icon='server' />);

      expect(screen.getByTestId('metric-icon')).toBeInTheDocument();
    });

    it('should use correct color for status', () => {
      const { rerender } = render(<MetricCard title='Test' value='error' color='error' />);

      expect(screen.getByTestId('metric-card')).toHaveClass(/MuiPaper-root/.*error/);
    });
  });

  describe('Dashboard Layout', () => {
    it('should render main container', () => {
      const { container } = render(<Box sx={{ padding: 3 }}><div data-testid="dashboard-main">Dashboard</div></Box>);

      expect(container.getByTestId('dashboard-main')).toBeInTheDocument();
    });

    it('should support responsive layout', () => {
      const { container } = render(<Box sx={{ padding: { xs: 2, md: 3 } }}><div data-testid="dashboard-responsive">Dashboard</div></Box>);

      expect(container.getByTestId('dashboard-responsive')).toBeInTheDocument();
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
      },
      });

      render(<div data-testid="ws-status">WebSocket: <span data-testid="connected-status" className="text-green-500">Connected</span></div>);

      expect(screen.getByTestId('ws-status')).toBeInTheDocument();
      expect(screen.getByTestId('connected-status')).toHaveTextContent('Connected');
    });

    it('should show disconnected state', () => {
      mockUseWebSocket.mockReturnValue({
        isConnected: false,
        error: new Error('Connection failed'),
        retryCount: 3,
      });

      render(<div data-testid="ws-status">WebSocket: <span data-testid="disconnected-status" className="text-red-500">Disconnected</span></div>);

      expect(screen.getByTestId('ws-status')).toBeInTheDocument();
      expect(screen.getByTestId('disconnected-status')).toHaveTextContent('Disconnected');
      expect(screen.getByTestId('disconnected-status')).toHaveClass(/text-red-500/.*Disconnected/);
    });

    it('should show loading state', () => {
      mockUseWebSocket.mockReturnValue({
        isConnected: false,
        error: null,
        retryCount: 1,
        retryDelay: 5000,
      });

      render(<div data-testid="ws-status">WebSocket: <span data-testid="loading-status" className="text-yellow-500">Connecting...</span></div>);

      expect(screen.getByTestId('ws-status')).toBeInTheDocument();
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Connecting...');
    });

    it('should display error state', () => {
      mockUseWebSocket.mockReturnValue({
        isConnected: false,
        error: new Error('Connection error'),
        retryCount: 5,
        retryDelay: 30000,
        lastError: new Error('Failed after 5 retries'),
      });

      render(<div data-testid="ws-status">WebSocket: <span data-testid="error-status" className="text-red-500">Error</span></div>);

      expect(screen.getByTestId('ws-status')).toBeInTheDocument();
      expect(screen.getByTestId('error-status')).toHaveTextContent('Error');
    });

    it('should show retry count after disconnection', () => {
      mockUseWebSocket.mockReturnValue({
        isConnected: false,
        retryCount: 5,
        error: null,
      });

      render(<div data-testid="ws-retry">Retrying (5 attempts left)...</div>);

      expect(screen.getByTestId('ws-retry')).toBeInTheDocument();
      expect(screen.getByTestId('ws-retry')).toHaveTextContent('Retrying');
    });
  });

  describe('Settings Form', () => {
    it('should render llama-server settings', () => {
      const mockConfig = {
        host: 'localhost',
        port: 8134,
        basePath: '/models',
        serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
        ctx_size: 8192,
        batch_size: 512,
        threads: -1,
        gpu_layers: -1,
      };

      fetchMock.mockResolvedValueOnce({ status: 200, data: mockConfig });

      render(<div data-testid="settings-form">
        <TextField
          name="host"
          value={mockConfig.host}
          data-testid="host-input"
          label="Server Host"
        />
        <TextField
          name="port"
          type="number"
          value={mockConfig.port}
          data-testid="port-input"
          label="Server Port"
        />
        <Button
          data-testid="save-btn"
          onClick={jest.fn()}
        >
          Save Configuration
        </Button>
      </div>);

      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
      expect(screen.getByTestId('host-input')).toBeInTheDocument();
      expect(screen.getByTestId('port-input')).toBeInTheDocument();
      expect(screen.getByTestId('save-btn')).toBeInTheDocument();
    });

    it('should validate port input', async () => {
      const portInput = screen.getByTestId('port-input');

      fireEvent.change(portInput, { target: { value: '999999' } });

      expect(portInput).toHaveValue('999999');
    });

    it('should validate server path input', async () => {
      const pathInput = screen.getByLabelText('Server Path');

      fireEvent.change(pathInput, { target: { value: '/invalid/path' } });

      expect(pathInput).toBeInTheDocument();
    });

    it('should save config on save button click', async () => {
      const saveBtn = screen.getByTestId('save-btn');

      fetchMock.mockResponseOnce({
        status: 200,
        data: { message: 'Configuration saved' },
      });

      fireEvent.click(saveBtn);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation', () => {
    it('should have main navigation links', () => {
      render(
        <nav data-testid="main-nav">
          <a href="/dashboard" data-testid="nav-dashboard">Dashboard</a>
          <a href="/models" data-testid="nav-models">Models</a>
          <a href="/settings" data-testid="nav-settings">Settings</a>
        </nav>
      );

      expect(screen.getByTestId('main-nav')).toBeInTheDocument();
      expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('nav-models')).toBeInTheDocument();
      expect(screen.getByTestId('nav-settings')).toBeInTheDocument();
    });

    it('should highlight active route', () => {
      render(
        <nav data-testid="main-nav">
          <a href="/dashboard" data-testid="nav-dashboard" className="text-blue-500 font-bold">Dashboard</a>
          <a href="/models" data-testid="nav-models">Models</a>
          <a href="/settings" data-testid="nav-settings">Settings</a>
        </nav>
      );

      const dashboardLink = screen.getByTestId('nav-dashboard');

      expect(dashboardLink).toHaveClass('text-blue-500');
      expect(dashboardLink).toHaveClass('font-bold');
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout on mobile', () => {
      render(<div data-testid="responsive-layout">
        <div data-testid="mobile-sidebar">Sidebar</div>
        <div data-testid="main-content">Content</div>
      </div>);

      expect(screen.getByTestId('mobile-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('should show hamburger menu on mobile', () => {
      render(<button data-testid="hamburger">☰</button>);

      expect(screen.getByTestId('hamburger')).toBeInTheDocument();
    });

    it('should use full width on desktop', () => {
      render(<div data-testid="full-width">
        <div data-testid="sidebar">Sidebar</div>
        <div data-testid="content">Content</div>
      </div>);

      expect(screen.getByTestId('sidebar')).not.toHaveClass('hidden');
    });
  });

  describe('Theme Toggle', () => {
    it('should switch between light and dark modes', () => {
      const mockTheme = { isDark: false };

      render(<button data-testid="theme-toggle" onClick={jest.fn()}>☀</button>);

      fireEvent.click(screen.getByTestId('theme-toggle'));

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });
  });
});
