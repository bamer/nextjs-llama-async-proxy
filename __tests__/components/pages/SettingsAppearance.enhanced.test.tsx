import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { SettingsAppearance } from '@/components/pages/settings/SettingsAppearance';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('SettingsAppearance', () => {
  const mockOnThemeChange = jest.fn();
  const mockSettings = {
    theme: 'light',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly', () => {
    render(<SettingsAppearance settings={mockSettings} onThemeChange={mockOnThemeChange} />);
    
    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('displays light theme option', () => {
    render(<SettingsAppearance settings={mockSettings} onThemeChange={mockOnThemeChange} />);
    
    expect(screen.getByText('light')).toBeInTheDocument();
  });

  it('displays dark theme option', () => {
    render(<SettingsAppearance settings={mockSettings} onThemeChange={mockOnThemeChange} />);
    
    expect(screen.getByText('dark')).toBeInTheDocument();
  });

  it('displays system theme option', () => {
    render(<SettingsAppearance settings={mockSettings} onThemeChange={mockOnThemeChange} />);
    
    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('displays light theme emoji', () => {
    render(<SettingsAppearance settings={mockSettings} onThemeChange={mockOnThemeChange} />);
    
    expect(screen.getByText('☀️')).toBeInTheDocument();
  });

  it('displays dark theme emoji', () => {
    render(<SettingsAppearance settings={mockSettings} onThemeChange={mockOnThemeChange} />);
    
    expect(screen.getByText('🌙')).toBeInTheDocument();
  });

  it('displays system theme emoji', () => {
    render(<SettingsAppearance settings={mockSettings} onThemeChange={mockOnThemeChange} />);
    
    expect(screen.getByText('💻')).toBeInTheDocument();
  });

  it('highlights active theme', () => {
    render(<SettingsAppearance settings={mockSettings} onThemeChange={mockOnThemeChange} />);
    
    const lightButton = screen.getByText('light');
    expect(lightButton.closest('button')).toHaveClass('border-blue-500');
  });

  it('calls onThemeChange when light theme is selected', () => {
    render(<SettingsAppearance settings={{ theme: 'dark' }} onThemeChange={mockOnThemeChange} />);
    
    const lightButton = screen.getByText('light');
    fireEvent.click(lightButton);
    
    expect(mockOnThemeChange).toHaveBeenCalledWith('light');
  });

  it('calls onThemeChange when dark theme is selected', () => {
    render(<SettingsAppearance settings={mockSettings} onThemeChange={mockOnThemeChange} />);
    
    const darkButton = screen.getByText('dark');
    fireEvent.click(darkButton);
    
    expect(mockOnThemeChange).toHaveBeenCalledWith('dark');
  });

  it('calls onThemeChange when system theme is selected', () => {
    render(<SettingsAppearance settings={mockSettings} onThemeChange={mockOnThemeChange} />);
    
    const systemButton = screen.getByText('system');
    fireEvent.click(systemButton);
    
    expect(mockOnThemeChange).toHaveBeenCalledWith('system');
  });

  it('applies correct styling for active light theme', () => {
    render(<SettingsAppearance settings={{ theme: 'light' }} onThemeChange={mockOnThemeChange} />);
    
    const lightButton = screen.getByText('light').closest('button');
    expect(lightButton).toHaveClass('bg-blue-50');
    expect(lightButton).toHaveClass('text-blue-700');
  });

  it('applies correct styling for active dark theme', () => {
    render(<SettingsAppearance settings={{ theme: 'dark' }} onThemeChange={mockOnThemeChange} />);
    
    const darkButton = screen.getByText('dark').closest('button');
    expect(darkButton).toHaveClass('text-blue-400');
  });

  it('applies correct styling for active system theme', () => {
    render(<SettingsAppearance settings={{ theme: 'system' }} onThemeChange={mockOnThemeChange} />);
    
    const systemButton = screen.getByText('system').closest('button');
    expect(systemButton).toHaveClass('border-blue-500');
  });

  it('applies default styling for inactive theme', () => {
    render(<SettingsAppearance settings={{ theme: 'light' }} onThemeChange={mockOnThemeChange} />);
    
    const darkButton = screen.getByText('dark').closest('button');
    expect(darkButton).toHaveClass('border-gray-300');
  });

  it('handles all theme changes correctly', () => {
    render(<SettingsAppearance settings={{ theme: 'light' }} onThemeChange={mockOnThemeChange} />);
    
    const darkButton = screen.getByText('dark');
    fireEvent.click(darkButton);
    expect(mockOnThemeChange).toHaveBeenCalledWith('dark');
    
    const systemButton = screen.getByText('system');
    fireEvent.click(systemButton);
    expect(mockOnThemeChange).toHaveBeenCalledWith('system');
    
    const lightButton = screen.getByText('light');
    fireEvent.click(lightButton);
    expect(mockOnThemeChange).toHaveBeenCalledWith('light');
  });

  it('renders three theme buttons', () => {
    render(<SettingsAppearance settings={mockSettings} onThemeChange={mockOnThemeChange} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });

  it('displays theme names in correct case', () => {
    render(<SettingsAppearance settings={mockSettings} onThemeChange={mockOnThemeChange} />);
    
    expect(screen.getByText('light')).toBeInTheDocument();
    expect(screen.getByText('dark')).toBeInTheDocument();
    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('has accessible button elements', () => {
    render(<SettingsAppearance settings={mockSettings} onThemeChange={mockOnThemeChange} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeEnabled();
    });
  });

  it('applies hover styles to inactive theme', () => {
    render(<SettingsAppearance settings={{ theme: 'light' }} onThemeChange={mockOnThemeChange} />);
    
    const darkButton = screen.getByText('dark').closest('button');
    expect(darkButton).toHaveClass('hover:border-blue-300');
  });
});
