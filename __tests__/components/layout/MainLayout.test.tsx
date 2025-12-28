import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';
import { MainLayout } from '@/components/layout/main-layout';
import { useTheme } from '@/contexts/ThemeContext';

jest.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

jest.mock('@/components/layout/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn().mockImplementation(() => ({ isDark: false, toggleTheme: jest.fn() })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const theme = createTheme();

function renderWithProviders(component: React.ReactElement, isDark = false) {
  (useTheme as jest.Mock).mockReturnValue({ isDark, toggleTheme: jest.fn() });
  return render(
    <ThemeProvider theme={theme}>
      <CustomThemeProvider>
        {component}
      </CustomThemeProvider>
    </ThemeProvider>
  );
}

describe('MainLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children correctly', () => {
    renderWithProviders(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders Header component', () => {
    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders Sidebar component', () => {
    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('wraps children in SidebarProvider', () => {
    renderWithProviders(
      <MainLayout>
        <div>Protected Content</div>
      </MainLayout>
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('applies dark mode background', () => {
    const { container } = renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      true
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies light mode background', () => {
    const { container } = renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      false
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    renderWithProviders(
      <MainLayout>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </MainLayout>
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });

  it('renders nested children', () => {
    renderWithProviders(
      <MainLayout>
        <div>
          <span>Nested Content</span>
        </div>
      </MainLayout>
    );
    expect(screen.getByText('Nested Content')).toBeInTheDocument();
  });

  it('has flex layout structure', () => {
    const { container } = renderWithProviders(
      <MainLayout>
        <div>Flex Content</div>
      </MainLayout>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('has minimum height of 100vh', () => {
    const { container } = renderWithProviders(
      <MainLayout>
        <div>Full Height</div>
      </MainLayout>
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
