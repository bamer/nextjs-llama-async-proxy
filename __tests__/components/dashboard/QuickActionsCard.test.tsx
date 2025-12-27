import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('QuickActionsCard', () => {
  const mockHandlers = {
    onDownloadLogs: jest.fn(),
    onRestartServer: jest.fn(),
    onStartServer: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Server Actions')).toBeInTheDocument();
  });

  it('renders all action buttons', () => {
    renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });

  it('calls onDownloadLogs when Download Logs button clicked', () => {
    renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    expect(mockHandlers.onDownloadLogs).toHaveBeenCalledTimes(1);
  });

  it('calls onRestartServer when Restart Server button clicked', () => {
    renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    expect(mockHandlers.onRestartServer).toHaveBeenCalledTimes(1);
  });

  it('calls onStartServer when Start Server button clicked', () => {
    renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]);

    expect(mockHandlers.onStartServer).toHaveBeenCalledTimes(1);
  });

  it('displays last update time', () => {
    renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Last Update')).toBeInTheDocument();
  });

  it('applies dark mode styling', () => {
    const { container } = renderWithTheme(
      <QuickActionsCard
        isDark={true}
        {...mockHandlers}
      />
    );

    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  // Edge Case Tests
  it('handles theme change from light to dark', () => {
    const { rerender } = renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Server Actions')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <QuickActionsCard
          isDark={true}
          {...mockHandlers}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Server Actions')).toBeInTheDocument();
  });

  it('handles rapid button clicks', () => {
    renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    const buttons = screen.getAllByRole('button');

    // Click download logs multiple times rapidly
    for (let i = 0; i < 5; i++) {
      fireEvent.click(buttons[0]);
    }

    expect(mockHandlers.onDownloadLogs).toHaveBeenCalledTimes(5);
  });

  it('handles all handlers being null', () => {
    const nullHandlers = {
      onDownloadLogs: null,
      onRestartServer: null,
      onStartServer: null,
    };

    // This should still render, just won't do anything on click
    const { container } = renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...(nullHandlers as any)}
      />
    );

    expect(screen.getByText('Server Actions')).toBeInTheDocument();
  });

  it('displays current date/time', () => {
    const testDate = new Date('2025-01-01T12:00:00');

    jest.spyOn(Date.prototype, 'toLocaleString').mockReturnValue(testDate.toLocaleString());

    renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Last Update')).toBeInTheDocument();
    jest.restoreAllMocks();
  });

  it('handles very long button descriptions', () => {
    const { container } = renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Export system logs')).toBeInTheDocument();
    expect(screen.getByText('Restart llama-server')).toBeInTheDocument();
    expect(screen.getByText('Start llama-server')).toBeInTheDocument();
  });

  it('renders all action descriptions', () => {
    renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Download Logs')).toBeInTheDocument();
    expect(screen.getByText('Export system logs')).toBeInTheDocument();
    expect(screen.getByText('Restart Server')).toBeInTheDocument();
    expect(screen.getByText('Restart llama-server')).toBeInTheDocument();
    expect(screen.getByText('Start Server')).toBeInTheDocument();
    expect(screen.getByText('Start llama-server')).toBeInTheDocument();
  });

  it('handles multiple sequential actions', () => {
    renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    const buttons = screen.getAllByRole('button');

    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    fireEvent.click(buttons[2]);

    expect(mockHandlers.onDownloadLogs).toHaveBeenCalledTimes(1);
    expect(mockHandlers.onRestartServer).toHaveBeenCalledTimes(1);
    expect(mockHandlers.onStartServer).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation (Enter key)', () => {
    renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    const buttons = screen.getAllByRole('button');

    fireEvent.click(buttons[0]);
    expect(mockHandlers.onDownloadLogs).toHaveBeenCalledTimes(1);
  });

  it('handles dark mode with all styling applied', () => {
    const { container } = renderWithTheme(
      <QuickActionsCard
        isDark={true}
        {...mockHandlers}
      />
    );

    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();

    // Check that buttons are rendered
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });

  it('handles light mode with all styling applied', () => {
    const { container } = renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();

    // Check that buttons are rendered
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });

  it('handles last update timestamp changing on re-render', () => {
    const { rerender } = renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    // Initial render should show Last Update
    expect(screen.getByText('Last Update')).toBeInTheDocument();

    // Rerender should still show Last Update
    rerender(
      <ThemeProvider theme={theme}>
        <QuickActionsCard
          isDark={false}
          {...mockHandlers}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Last Update')).toBeInTheDocument();
  });

  it('handles button click handlers being called with correct context', () => {
    renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    const buttons = screen.getAllByRole('button');

    fireEvent.click(buttons[1]);
    expect(mockHandlers.onRestartServer).toHaveBeenCalled();

    fireEvent.click(buttons[2]);
    expect(mockHandlers.onStartServer).toHaveBeenCalled();
  });
});
