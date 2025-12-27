import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string): void => {
      store[key] = value.toString();
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

jest.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: jest.fn(),
    theme: 'light',
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

function renderWithThemeProvider(component: React.ReactElement) {
  return render(<ThemeProvider>{component}</ThemeProvider>);
}

describe('ThemeToggle', () => {
  it('renders correctly', () => {
    renderWithThemeProvider(<ThemeToggle isDark={false} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays button in light mode', () => {
    renderWithThemeProvider(<ThemeToggle isDark={false} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays button in dark mode', () => {
    renderWithThemeProvider(<ThemeToggle isDark={true} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles theme toggle click', () => {
    const { container } = renderWithThemeProvider(<ThemeToggle isDark={false} />);

    const button = container.querySelector('button');
    if (button) {
      button.click();
    }

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
