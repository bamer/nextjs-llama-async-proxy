import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ConfigurationTabs } from '@/components/configuration/ConfigurationTabs';
import { useTheme } from '@/contexts/ThemeContext';

jest.mock('@/contexts/ThemeContext');

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('ConfigurationTabs', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useTheme).mockReturnValue({
      isDark: false,
      mode: 'light' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });
  });

  it('renders all tabs', () => {
    renderWithTheme(<ConfigurationTabs activeTab={0} onChange={mockOnChange} />);
    expect(screen.getByText('General Settings')).toBeInTheDocument();
    expect(screen.getByText('Llama-Server Settings')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('Logger Settings')).toBeInTheDocument();
  });

  it('renders correct number of tabs', () => {
    const { container } = renderWithTheme(<ConfigurationTabs activeTab={0} onChange={mockOnChange} />);
    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(4);
  });

  it('sets active tab correctly', () => {
    renderWithTheme(<ConfigurationTabs activeTab={1} onChange={mockOnChange} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onChange when tab is clicked', () => {
    renderWithTheme(<ConfigurationTabs activeTab={0} onChange={mockOnChange} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[2]);
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('passes correct event and value to onChange', () => {
    renderWithTheme(<ConfigurationTabs activeTab={0} onChange={mockOnChange} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]);
    expect(mockOnChange).toHaveBeenCalledWith(expect.any(Object), 1);
  });

  it('renders tabs in correct order', () => {
    const { container } = renderWithTheme(<ConfigurationTabs activeTab={0} onChange={mockOnChange} />);
    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs[0]).toHaveTextContent('General Settings');
    expect(tabs[1]).toHaveTextContent('Llama-Server Settings');
    expect(tabs[2]).toHaveTextContent('Advanced');
    expect(tabs[3]).toHaveTextContent('Logger Settings');
  });

  it('handles tab 0 activation', () => {
    renderWithTheme(<ConfigurationTabs activeTab={0} onChange={mockOnChange} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('handles tab 3 activation', () => {
    renderWithTheme(<ConfigurationTabs activeTab={3} onChange={mockOnChange} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[3]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
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
    renderWithTheme(<ConfigurationTabs activeTab={0} onChange={mockOnChange} />);
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });
});
