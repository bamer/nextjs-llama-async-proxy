import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header } from '@/components/layout/Header';
import { renderWithTheme, mockToggleSidebar } from './test-utils';

describe('Header - Basic Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('can import Header component', () => {
    expect(Header).toBeDefined();
    expect(typeof Header).toBe('function');
  });

  it('renders correctly', () => {
    renderWithTheme(<Header />);

    expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
  });

  it('renders menu toggle button', () => {
    renderWithTheme(<Header />);

    const toggleButton = screen.getByLabelText('Toggle sidebar');
    expect(toggleButton).toBeInTheDocument();
  });

  it('calls toggleSidebar when menu button is clicked', () => {
    renderWithTheme(<Header />);

    const toggleButton = screen.getByLabelText('Toggle sidebar');
    fireEvent.click(toggleButton);

    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('renders app bar with correct height', () => {
    renderWithTheme(<Header />);

    const appBar = screen.getByTestId('header-appbar');
    expect(appBar).toBeInTheDocument();
  });

  it('renders toolbar', () => {
    renderWithTheme(<Header />);

    const toolbar = screen.getByTestId('header-toolbar');
    expect(toolbar).toBeInTheDocument();
  });

  it('renders ThemeToggle component', () => {
    renderWithTheme(<Header />);

    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });
});
