import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { SettingsSystem } from '@/components/pages/settings/SettingsSystem';

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
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

const mockOnSliderChange = jest.fn();

describe('SettingsSystem', () => {
  beforeEach(() => {
    mockOnSliderChange.mockClear();
  });

  it('renders correctly with required props', () => {
    const settings = { maxConcurrentModels: 3, refreshInterval: 5 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    expect(screen.getByText('System Settings')).toBeInTheDocument();
  });

  it('displays Max Concurrent Models label', () => {
    const settings = { maxConcurrentModels: 3, refreshInterval: 5 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    expect(screen.getByText('Max Concurrent Models')).toBeInTheDocument();
  });

  it('displays Refresh Interval label', () => {
    const settings = { maxConcurrentModels: 3, refreshInterval: 5 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    expect(screen.getByText('Refresh Interval (seconds)')).toBeInTheDocument();
  });

  it('displays correct initial value for maxConcurrentModels', () => {
    const settings = { maxConcurrentModels: 5, refreshInterval: 5 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays correct initial value for refreshInterval', () => {
    const settings = { maxConcurrentModels: 3, refreshInterval: 7 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    expect(screen.getByText('7s')).toBeInTheDocument();
  });

  it('calls onSliderChange with maxConcurrentModels when its slider changes', () => {
    const settings = { maxConcurrentModels: 3, refreshInterval: 5 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '5' } });

    expect(mockOnSliderChange).toHaveBeenCalledTimes(1);
    expect(mockOnSliderChange).toHaveBeenCalledWith('maxConcurrentModels', 5);
  });

  it('calls onSliderChange with refreshInterval when its slider changes', () => {
    const settings = { maxConcurrentModels: 3, refreshInterval: 5 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[1], { target: { value: '8' } });

    expect(mockOnSliderChange).toHaveBeenCalledTimes(1);
    expect(mockOnSliderChange).toHaveBeenCalledWith('refreshInterval', 8);
  });

  it('handles minimum value for maxConcurrentModels', () => {
    const settings = { maxConcurrentModels: 5, refreshInterval: 5 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    const sliders = screen.getAllByRole('slider');
    expect(sliders[0]).toHaveAttribute('min', '1');
    expect(sliders[0]).toHaveAttribute('max', '10');
  });

  it('handles maximum value for maxConcurrentModels', () => {
    const settings = { maxConcurrentModels: 5, refreshInterval: 5 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '10' } });

    expect(mockOnSliderChange).toHaveBeenCalledWith('maxConcurrentModels', 10);
  });

  it('handles minimum value for refreshInterval', () => {
    const settings = { maxConcurrentModels: 5, refreshInterval: 5 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    const sliders = screen.getAllByRole('slider');
    expect(sliders[1]).toHaveAttribute('min', '1');
    expect(sliders[1]).toHaveAttribute('max', '10');
  });

  it('handles maximum value for refreshInterval', () => {
    const settings = { maxConcurrentModels: 5, refreshInterval: 5 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[1], { target: { value: '10' } });

    expect(mockOnSliderChange).toHaveBeenCalledWith('refreshInterval', 10);
  });

  it('displays range labels for maxConcurrentModels', () => {
    const settings = { maxConcurrentModels: 5, refreshInterval: 5 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    expect(screen.getByText('1 model')).toBeInTheDocument();
    expect(screen.getByText('10 models')).toBeInTheDocument();
  });

  it('displays range labels for refreshInterval', () => {
    const settings = { maxConcurrentModels: 5, refreshInterval: 5 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    expect(screen.getByText('1 second')).toBeInTheDocument();
    expect(screen.getByText('10 seconds')).toBeInTheDocument();
  });

  it('handles multiple slider changes in sequence', () => {
    const settings = { maxConcurrentModels: 5, refreshInterval: 5 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '3' } });
    fireEvent.change(sliders[1], { target: { value: '7' } });
    fireEvent.change(sliders[0], { target: { value: '8' } });

    expect(mockOnSliderChange).toHaveBeenCalledTimes(3);
    expect(mockOnSliderChange).toHaveBeenNthCalledWith(1, 'maxConcurrentModels', 3);
    expect(mockOnSliderChange).toHaveBeenNthCalledWith(2, 'refreshInterval', 7);
    expect(mockOnSliderChange).toHaveBeenNthCalledWith(3, 'maxConcurrentModels', 8);
  });

  it('handles value 1 for maxConcurrentModels', () => {
    const settings = { maxConcurrentModels: 1, refreshInterval: 5 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('handles value 1 for refreshInterval', () => {
    const settings = { maxConcurrentModels: 5, refreshInterval: 1 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    expect(screen.getByText('1s')).toBeInTheDocument();
  });

  it('handles value 10 for maxConcurrentModels', () => {
    const settings = { maxConcurrentModels: 10, refreshInterval: 5 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('handles value 10 for refreshInterval', () => {
    const settings = { maxConcurrentModels: 5, refreshInterval: 10 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    expect(screen.getByText('10s')).toBeInTheDocument();
  });

  it('renders correctly when maxConcurrentModels is null', () => {
    const settings = { maxConcurrentModels: null, refreshInterval: 5 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    expect(screen.getByText('System Settings')).toBeInTheDocument();
    expect(screen.getByText('Max Concurrent Models')).toBeInTheDocument();
  });

  it('renders correctly when refreshInterval is undefined', () => {
    const settings = { maxConcurrentModels: 5, refreshInterval: undefined };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    expect(screen.getByText('System Settings')).toBeInTheDocument();
    expect(screen.getByText('Refresh Interval (seconds)')).toBeInTheDocument();
  });

  it('renders correctly with empty settings object', () => {
    const settings = {};
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    expect(screen.getByText('System Settings')).toBeInTheDocument();
    expect(screen.getByText('Max Concurrent Models')).toBeInTheDocument();
    expect(screen.getByText('Refresh Interval (seconds)')).toBeInTheDocument();
  });

  it('handles rapid slider changes on same slider', () => {
    const settings = { maxConcurrentModels: 5, refreshInterval: 5 };
    renderWithTheme(
      <SettingsSystem settings={settings} onSliderChange={mockOnSliderChange} />
    );

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '2' } });
    fireEvent.change(sliders[0], { target: { value: '4' } });
    fireEvent.change(sliders[0], { target: { value: '6' } });

    expect(mockOnSliderChange).toHaveBeenCalledTimes(3);
    expect(mockOnSliderChange).toHaveBeenNthCalledWith(1, 'maxConcurrentModels', 2);
    expect(mockOnSliderChange).toHaveBeenNthCalledWith(2, 'maxConcurrentModels', 4);
    expect(mockOnSliderChange).toHaveBeenNthCalledWith(3, 'maxConcurrentModels', 6);
  });
});
