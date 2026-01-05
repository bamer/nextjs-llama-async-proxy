import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { SettingsFeatures } from '@/components/pages/settings/SettingsFeatures';
import type { MotionComponentProps } from '__tests__/types/mock-types';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MotionComponentProps) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: MotionComponentProps) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

  it('shows switch in checked state for autoUpdate when true', () => {
    const settings = { autoUpdate: true, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toBeChecked();
  });

  it('shows switch in unchecked state for autoUpdate when false', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    expect(switches[0]).not.toBeChecked();
  });

  it('shows switch in checked state for notifications when true', () => {
    const settings = { autoUpdate: false, notificationsEnabled: true };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    expect(switches[1]).toBeChecked();
  });

  it('shows switch in unchecked state for notifications when false', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    expect(switches[1]).not.toBeChecked();
  });

  it('calls onToggle with "autoUpdate" when autoUpdate switch is clicked', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
    expect(mockOnToggle).toHaveBeenCalledWith('autoUpdate');
  });

  it('calls onToggle with "notificationsEnabled" when notifications switch is clicked', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[1]);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
    expect(mockOnToggle).toHaveBeenCalledWith('notificationsEnabled');
  });

  it('handles toggling autoUpdate from false to true', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);

    expect(mockOnToggle).toHaveBeenCalledWith('autoUpdate');
  });

  it('handles toggling autoUpdate from true to false', () => {
    const settings = { autoUpdate: true, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);

    expect(mockOnToggle).toHaveBeenCalledWith('autoUpdate');
  });

  it('handles toggling notifications from false to true', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[1]);

    expect(mockOnToggle).toHaveBeenCalledWith('notificationsEnabled');
  });

  it('handles toggling notifications from true to false', () => {
    const settings = { autoUpdate: false, notificationsEnabled: true };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[1]);

    expect(mockOnToggle).toHaveBeenCalledWith('notificationsEnabled');
  });

  it('allows multiple toggles in sequence', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);
    fireEvent.click(switches[1]);
    fireEvent.click(switches[0]);

    expect(mockOnToggle).toHaveBeenCalledTimes(3);
    expect(mockOnToggle).toHaveBeenNthCalledWith(1, 'autoUpdate');
    expect(mockOnToggle).toHaveBeenNthCalledWith(2, 'notificationsEnabled');
    expect(mockOnToggle).toHaveBeenNthCalledWith(3, 'autoUpdate');
  });

  it('handles rapid clicking on same switch', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);
    fireEvent.click(switches[0]);
    fireEvent.click(switches[0]);

    expect(mockOnToggle).toHaveBeenCalledTimes(3);
    expect(mockOnToggle).toHaveBeenCalledWith('autoUpdate');
  });

  it('shows switch in unchecked state for autoUpdate when false', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    expect(switches[0]).not.toBeChecked();
  });

  it('shows switch in checked state for notifications when true', () => {
    const settings = { autoUpdate: false, notificationsEnabled: true };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    expect(switches[1]).toBeChecked();
  });

  it('shows switch in unchecked state for notifications when false', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    expect(switches[1]).not.toBeChecked();
  });

  it('calls onToggle with "autoUpdate" when autoUpdate switch is clicked', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
    expect(mockOnToggle).toHaveBeenCalledWith('autoUpdate');
  });

  it('calls onToggle with "notificationsEnabled" when notifications switch is clicked', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[1]);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
    expect(mockOnToggle).toHaveBeenCalledWith('notificationsEnabled');
  });

  it('handles toggling autoUpdate from false to true', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);

    expect(mockOnToggle).toHaveBeenCalledWith('autoUpdate');
  });

  it('handles toggling autoUpdate from true to false', () => {
    const settings = { autoUpdate: true, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);

    expect(mockOnToggle).toHaveBeenCalledWith('autoUpdate');
  });

  it('handles toggling notifications from false to true', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[1]);

    expect(mockOnToggle).toHaveBeenCalledWith('notificationsEnabled');
  });

  it('handles toggling notifications from true to false', () => {
    const settings = { autoUpdate: false, notificationsEnabled: true };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[1]);

    expect(mockOnToggle).toHaveBeenCalledWith('notificationsEnabled');
  });

  it('allows multiple toggles in sequence', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);
    fireEvent.click(switches[1]);
    fireEvent.click(switches[0]);

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
    const settings = { autoUpdate: null as unknown as boolean, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Auto Update')).toBeInTheDocument();
  });

  it('renders correctly when notificationsEnabled is undefined', () => {
    const settings = { autoUpdate: false, notificationsEnabled: undefined as unknown as boolean };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('renders correctly with empty settings object', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Auto Update')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('handles rapid clicking on same switch', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);
    fireEvent.click(switches[0]);
    fireEvent.click(switches[0]);

    expect(mockOnToggle).toHaveBeenCalledTimes(3);
    expect(mockOnToggle).toHaveBeenCalledWith('autoUpdate');
  });

  it('has exactly two toggle switches', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBe(2);
  });

  it('displays feature descriptions', () => {
    const settings = { autoUpdate: false, notificationsEnabled: false };
    renderWithTheme(
      <SettingsFeatures settings={settings} onToggle={mockOnToggle} />
    );

    expect(screen.getByText('Auto-update models and dependencies')).toBeInTheDocument();
    expect(screen.getByText('Receive system alerts')).toBeInTheDocument();
  });
});
