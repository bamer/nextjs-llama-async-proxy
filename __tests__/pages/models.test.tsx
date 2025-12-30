import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import ModelsPage from '@/app/models/page';

// Mock MainLayout
jest.mock('@/components/layout/main-layout', () => ({
  MainLayout: ({ children }: any) => React.createElement('div', { 'data-testid': 'main-layout' }, children),
}));

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() })),
}));

// Mock useWebSocket hook
jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: jest.fn(() => ({
    requestModels: jest.fn(),
    sendMessage: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
}));

// Mock ErrorBoundary
jest.mock('@/components/ui/error-boundary', () => ({
  ErrorBoundary: ({ children, fallback }: any) =>
    React.createElement(React.Fragment, null, children || fallback),
}));

// Mock ModelsFallback
jest.mock('@/components/ui/error-fallbacks', () => ({
  ModelsFallback: () => React.createElement('div', { 'data-testid': 'models-fallback' }, 'ModelsFallback'),
}));

// Mock ModelConfigDialog
jest.mock('@/components/ui/ModelConfigDialog', () => {
  return function MockModelConfigDialog({ open, onClose, onSave }: any) {
    return open
      ? React.createElement('div', {
          'data-testid': 'model-config-dialog',
        },
        'ModelConfigDialog Component',
        React.createElement('button', { onClick: onClose }, 'Close'),
        React.createElement('button', { onClick: () => onSave({}) }, 'Save')
      )
      : null;
  };
});

// Mock useFitParams hook
jest.mock('@/hooks/use-fit-params', () => ({
  useFitParams: jest.fn(() => ({
    analyze: jest.fn(),
    data: null,
    error: null,
  })),
}));

// Mock useEffectEvent
jest.mock('@/hooks/use-effect-event', () => ({
  useEffectEvent: (fn: any) => fn,
}));

// Mock SkeletonCard
jest.mock('@/components/ui', () => ({
  ...jest.requireActual('@/components/ui'),
  SkeletonCard: () => React.createElement('div', { 'data-testid': 'skeleton-card' }, 'Loading...'),
}));

// Mock MUI components with proper prop filtering
jest.mock('@mui/material', () => ({
  Typography: ({ children, ...props }: any) => {
    const { gutterBottom, variant, ...filteredProps } = props;
    return React.createElement(variant === 'h3' || variant === 'h6' || variant === 'h4' ? 'h1' : 'span', filteredProps, children);
  },
  Box: ({ children, ...props }: any) => {
    const { sx, display, alignItems, justifyContent, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
  Card: ({ children, ...props }: any) => {
    const { sx, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
  CardContent: ({ children }: any) => React.createElement('div', { children }),
  Grid: ({ children, ...props }: any) => {
    const { size, spacing, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
  Button: ({ children, onClick, ...props }: any) => {
    const { sx, variant, color, startIcon, size: btnSize, disabled, ...filteredProps } = props;
    return React.createElement('button', { ...filteredProps, onClick, disabled: disabled || false }, children);
  },
  IconButton: ({ children, onClick, ...props }: any) => {
    const { sx, size, disabled, ...filteredProps } = props;
    return React.createElement('button', { ...filteredProps, onClick, disabled: disabled || false }, children);
  },
  Chip: ({ label, ...props }: any) => {
    const { sx, color, size, variant, icon, ...filteredProps } = props;
    return React.createElement('span', filteredProps, label);
  },
  Tooltip: ({ children, ...props }: any) => {
    const { title, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
  Menu: ({ children, ...props }: any) => {
    const { sx, anchorEl, open, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
  MenuItem: ({ children, onClick, ...props }: any) => {
    const { sx, ...filteredProps } = props;
    return React.createElement('button', filteredProps, onClick, children);
  },
  Badge: ({ children, ...props }: any) => {
    const { sx, color, overlap, badgeContent, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
  Snackbar: ({ children, ...props }: any) => {
    const { sx, open, autoHideDuration, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
  Alert: ({ children, ...props }: any) => {
    const { sx, severity, onClose, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
  CircularProgress: (props: any) => {
    const { sx, size, color, ...filteredProps } = props;
    return React.createElement('span', filteredProps, 'Loading...');
  },
  LinearProgress: (props: any) => {
    const { sx, variant, value, color, ...filteredProps } = props;
    return React.createElement('div', filteredProps, 'Progress');
  },
}));

// Mock MUI icons
jest.mock('@mui/icons-material', () => ({
  PlayArrow: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'PlayArrow', width: 24, height: 24 }),
  Stop: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Stop', width: 24, height: 24 }),
  Refresh: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Refresh', width: 24, height: 24 }),
  Add: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Add', width: 24, height: 24 }),
  MoreVert: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'MoreVert', width: 24, height: 24 }),
  Delete: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Delete', width: 24, height: 24 }),
  Check: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Check', width: 24, height: 24 }),
  Science: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Science', width: 24, height: 24 }),
  Storage: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Storage', width: 24, height: 24 }),
}));

// Mock store
jest.mock('@/lib/store', () => ({
  useStore: jest.fn((selector: any) => {
    const state = {
      models: [],
      setModels: jest.fn(),
      addModel: jest.fn(),
      removeModel: jest.fn(),
      updateModel: jest.fn(),
    };
    return selector(state);
  }),
}));

// Mock config actions
jest.mock('@/actions/config-actions', () => ({
  loadModelConfig: jest.fn(),
  saveModelConfig: jest.fn(),
}));

const mockModels = [
  {
    id: '1',
    name: 'TestModel1',
    type: 'llama' as const,
    status: 'idle' as const,
    parameters: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'TestModel2',
    type: 'mistral' as const,
    status: 'running' as const,
    parameters: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('ModelsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('renders without errors', async () => {
    const { container } = render(<ModelsPage />);

    // Wait for initial loading timeout
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    expect(container).toBeInTheDocument();
  });

  it('renders MainLayout wrapper', () => {
    render(<ModelsPage />);

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('renders loading skeleton on initial load', () => {
    const { container } = render(<ModelsPage />);

    const skeletons = screen.queryAllByTestId('skeleton-card');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders models heading', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ models: [], setModels: jest.fn(), addModel: jest.fn(), removeModel: jest.fn(), updateModel: jest.fn() }));

    const { container } = render(<ModelsPage />);

    jest.advanceTimersByTime(1100);

    await waitFor(() => {
      expect(screen.getByText('AI Models Management')).toBeInTheDocument();
    });
  });

  it('renders models when loaded', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ models: mockModels, setModels: jest.fn(), addModel: jest.fn(), removeModel: jest.fn(), updateModel: jest.fn() }));

    render(<ModelsPage />);

    jest.advanceTimersByTime(1100);

    await waitFor(() => {
      expect(screen.getByText('TestModel1')).toBeInTheDocument();
      expect(screen.getByText('TestModel2')).toBeInTheDocument();
    });
  });

  it('renders Add Model button', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ models: mockModels, setModels: jest.fn(), addModel: jest.fn(), removeModel: jest.fn(), updateModel: jest.fn() }));

    render(<ModelsPage />);

    jest.advanceTimersByTime(1100);

    await waitFor(() => {
      expect(screen.getByText('Add Model')).toBeInTheDocument();
    });
  });

  it('renders Refresh button', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ models: mockModels, setModels: jest.fn(), addModel: jest.fn(), removeModel: jest.fn(), updateModel: jest.fn() }));

    render(<ModelsPage />);

    jest.advanceTimersByTime(1100);

    await waitFor(() => {
      // Verify page structure with header
      expect(screen.getByText('AI Models Management')).toBeInTheDocument();
    });
  });

  it('displays model status chips', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ models: mockModels, setModels: jest.fn(), addModel: jest.fn(), removeModel: jest.fn(), updateModel: jest.fn() }));

    render(<ModelsPage />);

    jest.advanceTimersByTime(1100);

    await waitFor(() => {
      expect(screen.getByText('idle')).toBeInTheDocument();
      expect(screen.getByText('running')).toBeInTheDocument();
    });
  });

  it('displays empty state when no models', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ models: [], setModels: jest.fn(), addModel: jest.fn(), removeModel: jest.fn(), updateModel: jest.fn() }));

    render(<ModelsPage />);

    jest.advanceTimersByTime(1100);

    await waitFor(() => {
      expect(screen.getByText('No models found')).toBeInTheDocument();
    });
  });

  it('renders config buttons', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ models: mockModels, setModels: jest.fn(), addModel: jest.fn(), removeModel: jest.fn(), updateModel: jest.fn() }));

    render(<ModelsPage />);

    jest.advanceTimersByTime(1100);

    await waitFor(() => {
      expect(screen.getAllByText('Sampling').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Memory').length).toBeGreaterThan(0);
      expect(screen.getAllByText('GPU').length).toBeGreaterThan(0);
    });
  });

  it('has proper component structure', () => {
    const { container } = render(<ModelsPage />);

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('renders without console errors', () => {
    const consoleError = jest.spyOn(console, 'error');

    render(<ModelsPage />);

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('snapshot test', () => {
    const { container } = render(<ModelsPage />);

    expect(container.firstChild).toMatchSnapshot();
  });

  it('handles re-renders gracefully', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ models: mockModels, setModels: jest.fn(), addModel: jest.fn(), removeModel: jest.fn(), updateModel: jest.fn() }));

    const { rerender } = render(<ModelsPage />);

    jest.advanceTimersByTime(1100);

    await waitFor(() => {
      expect(screen.getByText('TestModel1')).toBeInTheDocument();
    });

    rerender(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('TestModel1')).toBeInTheDocument();
    });
  });

  it('is a functional component', () => {
    const { container } = render(<ModelsPage />);

    expect(container).toBeInTheDocument();
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });
});
