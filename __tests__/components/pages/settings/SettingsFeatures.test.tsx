import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { SettingsFeatures } from '@/components/pages/settings/SettingsFeatures';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

const mockOnToggle = jest.fn();

describe('SettingsFeatures', () => {
  beforeEach(() => {
    mockOnToggle.mockClear();
  });

  it('renders correctly with required props', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    expect(screen.getByText('Features')).toBeInTheDocument();
  });

  it('displays Auto Update feature', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    expect(screen.getByText('Auto Update')).toBeInTheDocument();
    expect(
      screen.getByText('Auto-update models and dependencies')
    ).toBeInTheDocument();
  });

  it('displays Notifications feature', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Receive system alerts')).toBeInTheDocument();
  });

  it('shows toggle in enabled state for autoUpdate when true', () => {
    const settings = { autoUpdate: true, notificationsEnabled: false };
    const { container } = renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons[0]).toHaveClass('bg-blue-500');
  });

  it('shows toggle in disabled state for autoUpdate when false', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    const { container } = renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons[0]).toHaveClass('bg-gray-400');
  });

  it('shows toggle in enabled state for notifications when true', () => {
    const settings = { autoUpdate: false, notificationsEnabled: true };
    const { container } = renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons[1]).toHaveClass('bg-blue-500');
  });

  it('shows toggle in disabled state for notifications when false', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    const { container } = renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons[1]).toHaveClass('bg-gray-400');
  });

  it('calls onToggle with "autoUpdate" when autoUpdate toggle is clicked', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
    expect(mockOnToggle).toHaveBeenCalledWith('autoUpdate');
  });

  it('calls onToggle with "notificationsEnabled" when notifications toggle is clicked', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
    expect(mockOnToggle).toHaveBeenCalledWith('notificationsEnabled');
  });

  it('handles toggling autoUpdate from false to true', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    expect(mockOnToggle).toHaveBeenCalledWith('autoUpdate');
  });

  it('handles toggling autoUpdate from true to false', () => {
    const settings = { autoUpdate: true, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    expect(mockOnToggle).toHaveBeenCalledWith('autoUpdate');
  });

  it('handles toggling notifications from false to true', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    expect(mockOnToggle).toHaveBeenCalledWith('notificationsEnabled');
  });

  it('handles toggling notifications from true to false', () => {
    const settings = { autoUpdate: false, notificationsEnabled: true };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    expect(mockOnToggle).toHaveBeenCalledWith('notificationsEnabled');
  });

  it('allows multiple toggles in sequence', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    fireEvent.click(buttons[0]);

    expect(mockOnToggle).toHaveBeenCalledTimes(3);
    expect(mockOnToggle).toHaveBeenNthCalledWith(1, 'autoUpdate');
    expect(mockOnToggle).toHaveBeenNthCalledWith(2, 'notificationsEnabled');
    expect(mockOnToggle).toHaveBeenNthCalledWith(3, 'autoUpdate');
  });

  it('renders correctly when both features are enabled', () => {
    const settings = { autoUpdate: true, notificationsEnabled: true };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Auto Update')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('renders correctly when autoUpdate is null', () => {
    const settings = { autoUpdate: null, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Auto Update')).toBeInTheDocument();
  });

  it('renders correctly when notificationsEnabled is undefined', () => {
    const settings = { autoUpdate: false, notificationsEnabled: undefined };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('renders correctly with empty settings object', () => {
    const settings = {};
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Auto Update')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('handles rapid clicking on same toggle', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[0]);

    expect(mockOnToggle).toHaveBeenCalledTimes(3);
    expect(mockOnToggle).toHaveBeenCalledWith('autoUpdate');
  });
});
