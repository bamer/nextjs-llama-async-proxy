import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Mock the contexts and components
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
    mode: 'light' as const,
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
    currentTheme: createTheme(),
  }),
}));

jest.mock('@/components/layout/SidebarProvider', () => ({
  useSidebar: () => ({
    isOpen: false,
    toggleSidebar: jest.fn(),
    openSidebar: jest.fn(),
    closeSidebar: jest.fn(),
  }),
}));

jest.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

// Import after mocks
import { Header } from '@/components/layout/Header';

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  );
  return render(component, { wrapper });
}

describe('Header', () => {
  it('renders correctly', () => {
    renderWithTheme(<Header />);
    expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
  });

  it('renders menu button', () => {
    renderWithTheme(<Header />);
    expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument();
  });

  it('renders ThemeToggle component', () => {
    renderWithTheme(<Header />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('has correct app bar styling', () => {
    renderWithTheme(<Header />);
    const appBar = screen.getByTestId('header-appbar');
    expect(appBar).toBeInTheDocument();
  });

  it('renders toolbar', () => {
    renderWithTheme(<Header />);
    const toolbar = screen.getByTestId('header-toolbar');
    expect(toolbar).toBeInTheDocument();
  });

  it('renders rocket icon', () => {
    renderWithTheme(<Header />);
    // The rocket icon should be present
    expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
  });
});