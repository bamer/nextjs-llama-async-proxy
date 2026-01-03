import { useStore } from '@/lib/store';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: () => ({
    requestLogs: jest.fn(),
    isConnected: true,
  }),
}));

jest.mock('@/lib/store');

export const mockLogs = [
  {
    level: 'info',
    message: 'Application started',
    timestamp: '2024-01-01T10:00:00Z',
    source: 'application',
  },
  {
    level: 'error',
    message: 'Connection failed',
    timestamp: '2024-01-01T10:01:00Z',
    source: 'network',
  },
  {
    level: 'warn',
    message: 'Memory usage high',
    timestamp: '2024-01-01T10:02:00Z',
    context: { source: 'system' },
  },
  {
    level: 'debug',
    message: 'Debug information',
    timestamp: '2024-01-01T10:03:00Z',
  },
];

export const mockClearLogs = jest.fn();

export const mockState = {
  models: [],
  activeModelId: null,
  metrics: null,
  logs: mockLogs,
  settings: {
    theme: 'light',
    notifications: true,
    autoRefresh: true,
  },
  status: {
    isLoading: false,
    error: null,
  },
  chartHistory: {
    cpu: [],
    memory: [],
    requests: [],
    gpuUtil: [],
    power: [],
  },
  setModels: jest.fn(),
  addModel: jest.fn(),
  updateModel: jest.fn(),
  removeModel: jest.fn(),
  setActiveModel: jest.fn(),
  setMetrics: jest.fn(),
  addLog: jest.fn(),
  setLogs: jest.fn(),
  clearLogs: mockClearLogs,
  updateSettings: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
  clearError: jest.fn(),
  addChartData: jest.fn(),
  trimChartData: jest.fn(),
  clearChartData: jest.fn(),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseStore = useStore as any;
(mockUseStore as jest.Mock).mockImplementation((selector) => {
  if (typeof selector === 'function') {
    return selector(mockState);
  }
  return mockState;
});

// Mock getState for clearLogs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(useStore as any).getState = () => mockState;
