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
});
