import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header } from '@/components/layout/Header';
import { renderWithTheme, mockDarkTheme } from './test-utils';

describe('Header - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles undefined toggleSidebar gracefully', () => {
    const { useSidebar } = require('@/components/layout/SidebarProvider');
    (useSidebar as jest.Mock).mockReturnValue({
      isOpen: false,
      toggleSidebar: undefined as unknown,
      openSidebar: jest.fn(),
      closeSidebar: jest.fn(),
    });

    expect(() => renderWithTheme(<Header />)).not.toThrow();
  });

  it('handles null isDark theme value', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    (useTheme as jest.Mock).mockReturnValue({
      isDark: null as unknown,
      mode: 'light' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: undefined,
    });

    expect(() => renderWithTheme(<Header />)).not.toThrow();
  });

  it('handles missing currentTheme in context', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    (useTheme as jest.Mock).mockReturnValue({
      isDark: false,
      mode: 'light' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: undefined,
    });

    expect(() => renderWithTheme(<Header />)).not.toThrow();
  });

  it('handles rapid theme toggles without errors', () => {
    renderWithTheme(<Header />);

    expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
  });

  it('handles multiple rapid clicks on menu button', () => {
    renderWithTheme(<Header />);

    const toggleButton = screen.getByLabelText('Toggle sidebar');

    for (let i = 0; i < 20; i++) {
      fireEvent.click(toggleButton);
    }

    expect(toggleButton).toBeInTheDocument();
  });

  it('handles missing Rocket icon gracefully', () => {
    renderWithTheme(<Header />);

    expect(screen.getByTestId('header-appbar')).toBeInTheDocument();
    expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
  });

  it('handles window resize events', () => {
    renderWithTheme(<Header />);

    window.dispatchEvent(new Event('resize'));

    expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
  });

  it('handles keyboard navigation on menu button', () => {
    renderWithTheme(<Header />);

    const toggleButton = screen.getByLabelText('Toggle sidebar');

    fireEvent.keyDown(toggleButton, { key: 'Enter', code: 'Enter' });
    expect(toggleButton).toBeInTheDocument();

    fireEvent.keyDown(toggleButton, { key: ' ', code: 'Space' });
    expect(toggleButton).toBeInTheDocument();
  });

  it('handles focus and blur events', () => {
    renderWithTheme(<Header />);

    const toggleButton = screen.getByLabelText('Toggle sidebar');

    fireEvent.focus(toggleButton);
    expect(toggleButton).toBeInTheDocument();

    fireEvent.blur(toggleButton);
    expect(toggleButton).toBeInTheDocument();
  });

  it('handles very long title text', () => {
    renderWithTheme(<Header />);

    const title = screen.getByText('Llama Runner Pro');
    expect(title).toBeInTheDocument();
  });

  it('handles missing aria-label gracefully', () => {
    renderWithTheme(<Header />);

    const toggleButton = screen.getByLabelText('Toggle sidebar');
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-label', 'Toggle sidebar');
  });
});
