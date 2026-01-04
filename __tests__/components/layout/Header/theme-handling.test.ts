import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header } from '@/components/layout/Header';
import { renderWithTheme, mockDarkTheme, mockLightTheme } from './test-utils';

describe('Header - Theme Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies dark mode styles when isDark is true', () => {
    mockDarkTheme();
    renderWithTheme(<Header />);

    const appBar = screen.getByTestId('header-appbar');
    expect(appBar).toBeInTheDocument();
  });

  it('applies light mode styles when isDark is false', () => {
    mockLightTheme();
    renderWithTheme(<Header />);

    const appBar = screen.getByTestId('header-appbar');
    expect(appBar).toBeInTheDocument();
  });
});
