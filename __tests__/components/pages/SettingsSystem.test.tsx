import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { SettingsSystem } from '@/components/pages/settings/SettingsSystem';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('SettingsSystem', () => {
  const mockOnSliderChange = jest.fn();
  const mockSettings = {
    maxConcurrentModels: 5,
    refreshInterval: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    expect(screen.getByText('System Settings')).toBeInTheDocument();
  });

  it('displays max concurrent models label', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    expect(screen.getByText('Max Concurrent Models')).toBeInTheDocument();
  });

  it('displays max concurrent models value', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays refresh interval label', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    expect(screen.getByText('Refresh Interval (seconds)')).toBeInTheDocument();
  });

  it('displays refresh interval value with seconds suffix', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    expect(screen.getByText('5s')).toBeInTheDocument();
  });

  it('displays max concurrent models slider', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBe(2);
  });

  it('displays refresh interval slider', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBe(2);
  });

  it('calls onSliderChange when max concurrent models changes', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: 3 } });
    
    expect(mockOnSliderChange).toHaveBeenCalledWith('maxConcurrentModels', 3);
  });

  it('calls onSliderChange when refresh interval changes', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[1], { target: { value: 7 } });
    
    expect(mockOnSliderChange).toHaveBeenCalledWith('refreshInterval', 7);
  });

  it('displays correct min label for max concurrent models', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    expect(screen.getByText('1 model')).toBeInTheDocument();
  });

  it('displays correct max label for max concurrent models', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    expect(screen.getByText('10 models')).toBeInTheDocument();
  });

  it('displays correct min label for refresh interval', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    expect(screen.getByText('1 second')).toBeInTheDocument();
  });

  it('displays correct max label for refresh interval', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    expect(screen.getByText('10 seconds')).toBeInTheDocument();
  });

  it('handles minimum value for max concurrent models', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: 1 } });
    
    expect(mockOnSliderChange).toHaveBeenCalledWith('maxConcurrentModels', 1);
  });

  it('handles maximum value for max concurrent models', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: 10 } });
    
    expect(mockOnSliderChange).toHaveBeenCalledWith('maxConcurrentModels', 10);
  });

  it('handles minimum value for refresh interval', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[1], { target: { value: 1 } });
    
    expect(mockOnSliderChange).toHaveBeenCalledWith('refreshInterval', 1);
  });

  it('handles maximum value for refresh interval', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[1], { target: { value: 10 } });
    
    expect(mockOnSliderChange).toHaveBeenCalledWith('refreshInterval', 10);
  });

  it('handles different max concurrent models values', () => {
    render(<SettingsSystem settings={{ maxConcurrentModels: 3, refreshInterval: 5 }} onSliderChange={mockOnSliderChange} />);
    
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('handles different refresh interval values', () => {
    render(<SettingsSystem settings={{ maxConcurrentModels: 5, refreshInterval: 8 }} onSliderChange={mockOnSliderChange} />);
    
    expect(screen.getByText('8s')).toBeInTheDocument();
  });

  it('displays both sliders correctly', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    const sliders = screen.getAllByRole('slider');
    expect(sliders[0]).toHaveAttribute('min', '1');
    expect(sliders[0]).toHaveAttribute('max', '10');
    expect(sliders[1]).toHaveAttribute('min', '1');
    expect(sliders[1]).toHaveAttribute('max', '10');
  });

  it('handles rapid slider changes', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);

    const sliders = screen.getAllByRole('slider');

    fireEvent.change(sliders[0], { target: { value: '3' } });
    fireEvent.change(sliders[0], { target: { value: '7' } });
    fireEvent.change(sliders[0], { target: { value: '4' } });

    expect(mockOnSliderChange).toHaveBeenCalledTimes(3);
    expect(mockOnSliderChange).toHaveBeenNthCalledWith(1, 'maxConcurrentModels', 3);
    expect(mockOnSliderChange).toHaveBeenNthCalledWith(2, 'maxConcurrentModels', 7);
    expect(mockOnSliderChange).toHaveBeenNthCalledWith(3, 'maxConcurrentModels', 4);
  });

  it('handles changes to both sliders', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    const sliders = screen.getAllByRole('slider');
    
    fireEvent.change(sliders[0], { target: { value: 4 } });
    fireEvent.change(sliders[1], { target: { value: 6 } });
    
    expect(mockOnSliderChange).toHaveBeenCalledTimes(2);
    expect(mockOnSliderChange).toHaveBeenNthCalledWith(1, 'maxConcurrentModels', 4);
    expect(mockOnSliderChange).toHaveBeenNthCalledWith(2, 'refreshInterval', 6);
  });

  it('renders with empty settings', () => {
    render(<SettingsSystem settings={{}} onSliderChange={mockOnSliderChange} />);
    
    expect(screen.getByText('System Settings')).toBeInTheDocument();
  });

  it('handles zero value for max concurrent models', () => {
    render(<SettingsSystem settings={{ maxConcurrentModels: 0, refreshInterval: 5 }} onSliderChange={mockOnSliderChange} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles large value for max concurrent models', () => {
    render(<SettingsSystem settings={{ maxConcurrentModels: 100, refreshInterval: 5 }} onSliderChange={mockOnSliderChange} />);
    
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('displays correct styling for value display', () => {
    render(<SettingsSystem settings={mockSettings} onSliderChange={mockOnSliderChange} />);
    
    const valueDisplay = screen.getByText('5');
    expect(valueDisplay).toHaveClass('text-blue-600');
  });
});
