import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ConfigurationStatusMessages } from '@/components/configuration/ConfigurationStatusMessages';

jest.mock('framer-motion', () => ({
  m: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('ConfigurationStatusMessages', () => {
  beforeEach(() => {
    const { useTheme } = require('@/contexts/ThemeContext');
    jest.mocked(useTheme).mockReturnValue({ isDark: false });
  });

  it('renders nothing when no messages', () => {
    const { container } = renderWithTheme(
      <ConfigurationStatusMessages saveSuccess={false} validationErrors={[]} />
    );
    expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
  });

  it('renders success message when saveSuccess is true', () => {
    renderWithTheme(
      <ConfigurationStatusMessages saveSuccess={true} validationErrors={[]} />
    );
    expect(screen.getByText('Configuration saved successfully!')).toBeInTheDocument();
  });

  it('renders success message with check icon', () => {
    renderWithTheme(
      <ConfigurationStatusMessages saveSuccess={true} validationErrors={[]} />
    );
    expect(screen.getByText('Configuration saved successfully!')).toBeInTheDocument();
  });

  it('renders validation errors when errors present', () => {
    const errors = ['Host is required', 'Port must be valid'];
    renderWithTheme(
      <ConfigurationStatusMessages saveSuccess={false} validationErrors={errors} />
    );
    expect(screen.getByText('Configuration Errors')).toBeInTheDocument();
    expect(screen.getByText('• Host is required')).toBeInTheDocument();
    expect(screen.getByText('• Port must be valid')).toBeInTheDocument();
  });

  it('renders error outline icon for validation errors', () => {
    const errors = ['Test error'];
    renderWithTheme(
      <ConfigurationStatusMessages saveSuccess={false} validationErrors={errors} />
    );
    expect(screen.getByText('Configuration Errors')).toBeInTheDocument();
  });

  it('renders both success and error messages when both present', () => {
    const errors = ['Validation error'];
    renderWithTheme(
      <ConfigurationStatusMessages saveSuccess={true} validationErrors={errors} />
    );
    expect(screen.getByText('Configuration saved successfully!')).toBeInTheDocument();
    expect(screen.getByText('Configuration Errors')).toBeInTheDocument();
  });

  it('renders multiple validation errors with bullets', () => {
    const errors = ['Error 1', 'Error 2', 'Error 3'];
    renderWithTheme(
      <ConfigurationStatusMessages saveSuccess={false} validationErrors={errors} />
    );
    expect(screen.getByText('• Error 1')).toBeInTheDocument();
    expect(screen.getByText('• Error 2')).toBeInTheDocument();
    expect(screen.getByText('• Error 3')).toBeInTheDocument();
  });

  it('renders empty errors array correctly', () => {
    renderWithTheme(
      <ConfigurationStatusMessages saveSuccess={false} validationErrors={[]} />
    );
    expect(screen.queryByText('Configuration Errors')).not.toBeInTheDocument();
  });

  it('handles single validation error', () => {
    const errors = ['Single error message'];
    renderWithTheme(
      <ConfigurationStatusMessages saveSuccess={false} validationErrors={errors} />
    );
    expect(screen.getByText('• Single error message')).toBeInTheDocument();
  });

  it('renders success message with dark theme', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
    mockUseTheme.mockReturnValue({ isDark: true });
    renderWithTheme(
      <ConfigurationStatusMessages saveSuccess={true} validationErrors={[]} />
    );
    expect(screen.getByText('Configuration saved successfully!')).toBeInTheDocument();
  });

  it('renders validation errors with dark theme', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
    mockUseTheme.mockReturnValue({ isDark: true });
    const errors = ['Test error'];
    renderWithTheme(
      <ConfigurationStatusMessages saveSuccess={false} validationErrors={errors} />
    );
    expect(screen.getByText('Configuration Errors')).toBeInTheDocument();
  });
});
