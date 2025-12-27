import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ConfigurationActions } from '@/components/configuration/ConfigurationActions';

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('ConfigurationActions', () => {
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with required props', () => {
    renderWithTheme(<ConfigurationActions isSaving={false} onSave={mockOnSave} />);
    expect(screen.getByText('Save Configuration')).toBeInTheDocument();
  });

  it('displays Save button', () => {
    renderWithTheme(<ConfigurationActions isSaving={false} onSave={mockOnSave} />);
    const saveButton = screen.getByRole('button');
    expect(saveButton).toBeInTheDocument();
  });

  it('calls onSave when button is clicked', () => {
    renderWithTheme(<ConfigurationActions isSaving={false} onSave={mockOnSave} />);
    const saveButton = screen.getByRole('button');
    fireEvent.click(saveButton);
    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it('shows Saving... text when isSaving is true', () => {
    renderWithTheme(<ConfigurationActions isSaving={true} onSave={mockOnSave} />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.queryByText('Save Configuration')).not.toBeInTheDocument();
  });

  it('disables button when isSaving is true', () => {
    renderWithTheme(<ConfigurationActions isSaving={true} onSave={mockOnSave} />);
    const saveButton = screen.getByRole('button');
    expect(saveButton).toBeDisabled();
  });

  it('enables button when isSaving is false', () => {
    renderWithTheme(<ConfigurationActions isSaving={false} onSave={mockOnSave} />);
    const saveButton = screen.getByRole('button');
    expect(saveButton).not.toBeDisabled();
  });

  it('does not call onSave when button is disabled', () => {
    renderWithTheme(<ConfigurationActions isSaving={true} onSave={mockOnSave} />);
    const saveButton = screen.getByRole('button');
    fireEvent.click(saveButton);
    expect(mockOnSave).not.toHaveBeenCalled();
  });
});
