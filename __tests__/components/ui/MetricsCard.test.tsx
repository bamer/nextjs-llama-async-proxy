import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MetricsCard } from '@/components/ui/MetricsCard';

const theme = createTheme();

jest.mock('@/lib/store', () => ({
  useStore: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('framer-motion', () => ({
  m: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const { useStore } = require('@/lib/store');
const { useTheme } = require('@/contexts/ThemeContext');

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('MetricsCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when metrics is null', () => {
    useStore.mockImplementation((selector) => selector({ metrics: null }));
    useTheme.mockReturnValue({ isDark: false });

    renderWithTheme(<MetricsCard />);

    expect(screen.getByText('System Metrics')).toBeInTheDocument();
    expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders metrics data when available', () => {
    const mockMetrics = {
      cpuUsage: 45.5,
      memoryUsage: 62.3,
      activeModels: 5,
      avgResponseTime: 250,
      totalRequests: 842,
    };

    useStore.mockImplementation((selector) => selector({ metrics: mockMetrics }));
    useTheme.mockReturnValue({ isDark: false });

    renderWithTheme(<MetricsCard />);

    expect(screen.getByText('System Metrics')).toBeInTheDocument();
    expect(screen.getAllByText(/45\.5%/).length).toBeGreaterThan(0);
    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
  });

  it('displays all metric labels', () => {
    const mockMetrics = {
      cpuUsage: 50,
      memoryUsage: 60,
      activeModels: 5,
      avgResponseTime: 500,
      totalRequests: 1000,
    };

    useStore.mockImplementation((selector) => selector({ metrics: mockMetrics }));
    useTheme.mockReturnValue({ isDark: false });

    renderWithTheme(<MetricsCard />);

    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    expect(screen.getByText('Available Models')).toBeInTheDocument();
    expect(screen.getByText('Avg Response')).toBeInTheDocument();
    expect(screen.getByText('Total Requests')).toBeInTheDocument();
  });

  it('displays correct metric values', () => {
    const mockMetrics = {
      cpuUsage: 78.9,
      memoryUsage: 85.2,
      activeModels: 7,
      avgResponseTime: 1250,
      totalRequests: 2456,
    };

    useStore.mockImplementation((selector) => selector({ metrics: mockMetrics }));
    useTheme.mockReturnValue({ isDark: false });

    renderWithTheme(<MetricsCard />);

    expect(screen.getAllByText(/78\.9%/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/85\.2%/).length).toBeGreaterThan(0);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('1250ms')).toBeInTheDocument();
    expect(screen.getByText('2456')).toBeInTheDocument();
  });

  it('applies dark mode styles', () => {
    const mockMetrics = {
      cpuUsage: 50,
      memoryUsage: 60,
      activeModels: 5,
      avgResponseTime: 500,
      totalRequests: 1000,
    };

    useStore.mockImplementation((selector) => selector({ metrics: mockMetrics }));
    useTheme.mockReturnValue({ isDark: true });

    const { container } = renderWithTheme(<MetricsCard />);

    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  it('applies light mode styles', () => {
    const mockMetrics = {
      cpuUsage: 50,
      memoryUsage: 60,
      activeModels: 5,
      avgResponseTime: 500,
      totalRequests: 1000,
    };

    useStore.mockImplementation((selector) => selector({ metrics: mockMetrics }));
    useTheme.mockReturnValue({ isDark: false });

    const { container } = renderWithTheme(<MetricsCard />);

    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  it('handles zero values', () => {
    const mockMetrics = {
      cpuUsage: 0,
      memoryUsage: 0,
      activeModels: 0,
      avgResponseTime: 0,
      totalRequests: 0,
    };

    useStore.mockImplementation((selector) => selector({ metrics: mockMetrics }));
    useTheme.mockReturnValue({ isDark: false });

    renderWithTheme(<MetricsCard />);

    expect(screen.getAllByText(/0\.0%/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('handles large values', () => {
    const mockMetrics = {
      cpuUsage: 99.9,
      memoryUsage: 98.5,
      activeModels: 10,
      avgResponseTime: 5000,
      totalRequests: 10000,
    };

    useStore.mockImplementation((selector) => selector({ metrics: mockMetrics }));
    useTheme.mockReturnValue({ isDark: false });

    renderWithTheme(<MetricsCard />);

    expect(screen.getAllByText(/99\.9%/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/98\.5%/).length).toBeGreaterThan(0);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5000ms')).toBeInTheDocument();
    expect(screen.getByText('10000')).toBeInTheDocument();
  });

  it('displays percentage values for progress bars', () => {
    const mockMetrics = {
      cpuUsage: 75.5,
      memoryUsage: 50.0,
      activeModels: 5,
      avgResponseTime: 750,
      totalRequests: 500,
    };

    useStore.mockImplementation((selector) => selector({ metrics: mockMetrics }));
    useTheme.mockReturnValue({ isDark: false });

    renderWithTheme(<MetricsCard />);

    expect(screen.getAllByText(/75\.5%/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/50\.0%/).length).toBeGreaterThan(0);
  });

  it('renders subheader correctly', () => {
    useStore.mockImplementation((selector) => selector({ metrics: null }));
    useTheme.mockReturnValue({ isDark: false });

    renderWithTheme(<MetricsCard />);

    expect(screen.getByText('Real-time system performance')).toBeInTheDocument();
  });

  it('uses correct progress bar colors for different values', () => {
    const mockMetrics = {
      cpuUsage: 90,
      memoryUsage: 70,
      activeModels: 5,
      avgResponseTime: 500,
      totalRequests: 1000,
    };

    useStore.mockImplementation((selector) => selector({ metrics: mockMetrics }));
    useTheme.mockReturnValue({ isDark: false });

    const { container } = renderWithTheme(<MetricsCard />);

    const progressBars = container.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('handles decimal values correctly', () => {
    const mockMetrics = {
      cpuUsage: 45.67,
      memoryUsage: 62.89,
      activeModels: 5,
      avgResponseTime: 250,
      totalRequests: 842,
    };

    useStore.mockImplementation((selector) => selector({ metrics: mockMetrics }));
    useTheme.mockReturnValue({ isDark: false });

    renderWithTheme(<MetricsCard />);

    expect(screen.getAllByText(/45\.7%/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/62\.9%/).length).toBeGreaterThan(0);
  });

  it('calls useStore hook', () => {
    const mockMetrics = {
      cpuUsage: 50,
      memoryUsage: 60,
      activeModels: 5,
      avgResponseTime: 500,
      totalRequests: 1000,
    };

    useStore.mockImplementation((selector) => selector({ metrics: mockMetrics }));
    useTheme.mockReturnValue({ isDark: false });

    renderWithTheme(<MetricsCard />);

    expect(useStore).toHaveBeenCalled();
  });

  it('calls useTheme hook', () => {
    const mockMetrics = {
      cpuUsage: 50,
      memoryUsage: 60,
      activeModels: 5,
      avgResponseTime: 500,
      totalRequests: 1000,
    };

    useStore.mockImplementation((selector) => selector({ metrics: mockMetrics }));
    useTheme.mockReturnValue({ isDark: false });

    renderWithTheme(<MetricsCard />);

    expect(useTheme).toHaveBeenCalled();
  });
});
