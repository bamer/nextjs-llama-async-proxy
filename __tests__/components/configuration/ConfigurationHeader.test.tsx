import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ConfigurationHeader } from '@/components/configuration/ConfigurationHeader';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { MotionComponentProps } from '__tests__/types/mock-types';

jest.mock('framer-motion', () => ({
  m: {
    div: ({ children, ...props }: MotionComponentProps) => <div {...props}>{children}</div>,
  },
}));

jest.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTheme: jest.fn(),
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('ConfigurationHeader', () => {
  beforeEach(() => {
    jest.mocked(useTheme).mockReturnValue({
      isDark: false,
      mode: 'light' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });
  });

  it('renders correctly', () => {
    renderWithTheme(<ConfigurationHeader />);
    expect(screen.getByText('Configuration Center')).toBeInTheDocument();
  });

  it('renders subtitle text', () => {
    renderWithTheme(<ConfigurationHeader />);
    expect(screen.getByText('Manage your application settings and preferences')).toBeInTheDocument();
  });

  it('renders with correct heading level', () => {
    const { container } = renderWithTheme(<ConfigurationHeader />);
    const heading = container.querySelector('h1');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Configuration Center');
  });

  it('renders divider', () => {
    const { container } = renderWithTheme(<ConfigurationHeader />);
    const divider = container.querySelector('.MuiDivider-root');
    expect(divider).toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
    mockUseTheme.mockReturnValue({
      isDark: true,
      mode: 'dark' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });
    const { container } = renderWithTheme(<ConfigurationHeader />);
    const divider = container.querySelector('.MuiDivider-root');
    expect(divider).toBeInTheDocument();
  });
});
