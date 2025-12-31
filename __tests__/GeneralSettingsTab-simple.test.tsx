import { describe } from '@jest/globals';
import { renderWithTheme } from '@/test-utils';
import { screen } from '@testing-library/react';
import { GeneralSettingsTab } from '@/components/configuration/GeneralSettingsTab';
import { defaultFormConfig } from '@/test-utils';

const mockOnInputChange = jest.fn();

describe('GeneralSettingsTab - Simple Test', () => {
  it('should render alert when maxConcurrentModels is 1', () => {
    const config = { ...defaultFormConfig, maxConcurrentModels: 1 };
    renderWithTheme(
      <GeneralSettingsTab formConfig={config} onInputChange={mockOnInputChange} fieldErrors={{}} />
    );

    // Check that Alert is rendered
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Single Model Mode:')).toBeInTheDocument();
    expect(screen.getByText(/Only one model can be loaded at a time/)).toBeInTheDocument();
  });
});