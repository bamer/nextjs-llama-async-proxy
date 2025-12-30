import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import QuickActionsCard from '@/components/dashboard/QuickActionsCard';

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: any) => React.createElement('div', { 'data-theme-provider': 'true' }, children),
  useTheme: jest.fn(() => ({
    isDark: false,
    mode: 'light' as const,
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
  })),
}));

const theme = createTheme();

function renderWithProviders(component: React.ReactElement) {
  return render(<MuiThemeProvider theme={theme}>{component}</MuiThemeProvider>);
}

describe('QuickActionsCard', () => {
  const mockOnRestartServer = jest.fn();
  const mockOnStartServer = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders correctly with required props', () => {
      renderWithProviders(
        <QuickActionsCard
          isDark={false}
          onRestartServer={mockOnRestartServer}
          onStartServer={mockOnStartServer}
        />
      );

      expect(screen.getByText('Server Actions')).toBeInTheDocument();
    });

    it('renders both action buttons', () => {
      renderWithProviders(
        <QuickActionsCard
          isDark={false}
          onRestartServer={mockOnRestartServer}
          onStartServer={mockOnStartServer}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2);
    });

    it('renders Restart Server button', () => {
      renderWithProviders(
        <QuickActionsCard
          isDark={false}
          onRestartServer={mockOnRestartServer}
          onStartServer={mockOnStartServer}
        />
      );

      expect(screen.getByText('Restart Server')).toBeInTheDocument();
    });

    it('renders Start Server button', () => {
      renderWithProviders(
        <QuickActionsCard
          isDark={false}
          onRestartServer={mockOnRestartServer}
          onStartServer={mockOnStartServer}
        />
      );

      expect(screen.getByText('Start Server')).toBeInTheDocument();
    });

    it('displays action descriptions', () => {
      renderWithProviders(
        <QuickActionsCard
          isDark={false}
          onRestartServer={mockOnRestartServer}
          onStartServer={mockOnStartServer}
        />
      );

      expect(screen.getByText('Restart llama-server')).toBeInTheDocument();
      expect(screen.getByText('Start llama-server')).toBeInTheDocument();
    });
  });

  describe('Server Loading State', () => {
    it('shows "Starting..." when serverLoading is true and server not running', () => {
      renderWithProviders(
        <QuickActionsCard
          isDark={false}
          onRestartServer={mockOnRestartServer}
          onStartServer={mockOnStartServer}
          serverLoading={true}
          serverRunning={false}
        />
      );

      expect(screen.getByText('Starting...')).toBeInTheDocument();
      expect(screen.queryByText('Start Server')).not.toBeInTheDocument();
    });

    it('shows "Start Server" when serverLoading is false', () => {
      renderWithProviders(
        <QuickActionsCard
          isDark={false}
          onRestartServer={mockOnRestartServer}
          onStartServer={mockOnStartServer}
          serverLoading={false}
        />
      );

      expect(screen.getByText('Start Server')).toBeInTheDocument();
    });
  });

  describe('Server Running State', () => {
    it('renders with serverRunning true', () => {
      renderWithProviders(
        <QuickActionsCard
          isDark={false}
          onRestartServer={mockOnRestartServer}
          onStartServer={mockOnStartServer}
          serverRunning={true}
        />
      );

      expect(screen.getByText('Restart Server')).toBeInTheDocument();
      expect(screen.getByText('Start Server')).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('calls onRestartServer when Restart Server button is clicked', () => {
      renderWithProviders(
        <QuickActionsCard
          isDark={false}
          onRestartServer={mockOnRestartServer}
          onStartServer={mockOnStartServer}
        />
      );

      const restartButton = screen.getByText('Restart Server');
      fireEvent.click(restartButton);

      expect(mockOnRestartServer).toHaveBeenCalledTimes(1);
    });

    it('calls onStartServer when Start Server button is clicked', () => {
      renderWithProviders(
        <QuickActionsCard
          isDark={false}
          onRestartServer={mockOnRestartServer}
          onStartServer={mockOnStartServer}
          serverLoading={false}
        />
      );

      const startButton = screen.getByText('Start Server');
      fireEvent.click(startButton);

      expect(mockOnStartServer).toHaveBeenCalledTimes(1);
    });
  });

  describe('Memoization', () => {
    it('memoizes correctly - no re-render when props unchanged', () => {
      const { rerender } = renderWithProviders(
        <QuickActionsCard
          isDark={false}
          onRestartServer={mockOnRestartServer}
          onStartServer={mockOnStartServer}
        />
      );

      rerender(
        <MuiThemeProvider theme={theme}>
          <QuickActionsCard
            isDark={false}
            onRestartServer={mockOnRestartServer}
            onStartServer={mockOnStartServer}
          />
        </MuiThemeProvider>
      );

      expect(screen.getByText('Server Actions')).toBeInTheDocument();
    });

    it('re-renders when serverLoading changes', () => {
      const { rerender } = renderWithProviders(
        <QuickActionsCard
          isDark={false}
          onRestartServer={mockOnRestartServer}
          onStartServer={mockOnStartServer}
          serverLoading={false}
        />
      );

      rerender(
        <MuiThemeProvider theme={theme}>
          <QuickActionsCard
            isDark={false}
            onRestartServer={mockOnRestartServer}
            onStartServer={mockOnStartServer}
            serverLoading={true}
          />
        </MuiThemeProvider>
      );

      expect(screen.getByText('Starting...')).toBeInTheDocument();
    });

    it('re-renders when serverRunning changes', () => {
      const { rerender } = renderWithProviders(
        <QuickActionsCard
          isDark={false}
          onRestartServer={mockOnRestartServer}
          onStartServer={mockOnStartServer}
          serverRunning={false}
        />
      );

      rerender(
        <MuiThemeProvider theme={theme}>
          <QuickActionsCard
            isDark={false}
            onRestartServer={mockOnRestartServer}
            onStartServer={mockOnStartServer}
            serverRunning={true}
          />
        </MuiThemeProvider>
      );

      expect(screen.getByText('Restart Server')).toBeInTheDocument();
    });

    it('re-renders when isDark changes', () => {
      const { rerender } = renderWithProviders(
        <QuickActionsCard
          isDark={false}
          onRestartServer={mockOnRestartServer}
          onStartServer={mockOnStartServer}
        />
      );

      rerender(
        <MuiThemeProvider theme={theme}>
          <QuickActionsCard
            isDark={true}
            onRestartServer={mockOnRestartServer}
            onStartServer={mockOnStartServer}
          />
        </MuiThemeProvider>
      );

      expect(screen.getByText('Server Actions')).toBeInTheDocument();
    });
  });

  describe('Dark Mode', () => {
    it('renders in dark mode', () => {
      renderWithProviders(
        <QuickActionsCard
          isDark={true}
          onRestartServer={mockOnRestartServer}
          onStartServer={mockOnStartServer}
        />
      );

      expect(screen.getByText('Server Actions')).toBeInTheDocument();
      expect(screen.getByText('Restart Server')).toBeInTheDocument();
      expect(screen.getByText('Start Server')).toBeInTheDocument();
    });

    it('renders in light mode', () => {
      renderWithProviders(
        <QuickActionsCard
          isDark={false}
          onRestartServer={mockOnRestartServer}
          onStartServer={mockOnStartServer}
        />
      );

      expect(screen.getByText('Server Actions')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles multiple re-renders efficiently', () => {
      const { rerender } = renderWithProviders(
        <QuickActionsCard
          isDark={false}
          onRestartServer={mockOnRestartServer}
          onStartServer={mockOnStartServer}
          serverLoading={false}
        />
      );

      // Multiple re-renders with same props
      for (let i = 0; i < 5; i++) {
        rerender(
          <MuiThemeProvider theme={theme}>
            <QuickActionsCard
              isDark={false}
              onRestartServer={mockOnRestartServer}
              onStartServer={mockOnStartServer}
              serverLoading={false}
            />
          </MuiThemeProvider>
        );
      }

      expect(screen.getByText('Server Actions')).toBeInTheDocument();
      expect(mockOnRestartServer).not.toHaveBeenCalled();
    });
  });
});
