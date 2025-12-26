import { describe, it, expect, vi } from '@jest/globals';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

const mockTheme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={mockTheme}>{component}</ThemeProvider>);
}

describe('QuickActionsCard', () => {
  const mockHandlers = {
    onDownloadLogs: vi.fn(),
    onRestartServer: vi.fn(),
    onStartServer: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    expect(document.querySelector('h6')?.textContent).toContain('Server Actions');
  });

  it('renders all action buttons', () => {
    renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBe(3);
  });

  it('calls onDownloadLogs when Download Logs button clicked', () => {
    renderWithTheme(
      <QuickActionsCard
        isDark={false}
        {...mockHandlers}
      />
    );

    const buttons = document.querySelectorAll('button');
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

    const buttons = document.querySelectorAll('button');
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

    const buttons = document.querySelectorAll('button');
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

    expect(document.textContent).toContain('Last Update');
  });
});
