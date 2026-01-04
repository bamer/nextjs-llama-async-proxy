import { screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { GeneralSettingsTab } from '@/components/configuration/GeneralSettingsTab';
import {
  renderWithTheme,
  defaultFormConfig,
  defaultFieldErrors,
  clearAllMocks,
  setupLightThemeMock,
} from './test-utils';

jest.mock('@/contexts/ThemeContext');

jest.mock('framer-motion', () => ({
  m: {
    div: (props: unknown) => {
      const { children, ...rest } = props as { children?: React.ReactNode; [key: string]: unknown };
      return React.createElement('div', rest as any, children);
    },
  },
}));

describe('GeneralSettingsTab State Management', () => {
  const mockOnInputChange = jest.fn();

  beforeEach(() => {
    clearAllMocks();
    setupLightThemeMock();
  });

  afterEach(() => {
    cleanup();
  });

  it('displays correct initial switch states', () => {
    const config = {
      ...defaultFormConfig,
      autoUpdate: false,
      notificationsEnabled: true,
    };
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={config}
        onInputChange={mockOnInputChange}
        fieldErrors={{}}
      />,
    );
    const autoUpdateSwitch = screen.getByLabelText('Auto Update') as HTMLInputElement;
    const notificationsSwitch = screen.getByLabelText(
      'Notifications Enabled',
    ) as HTMLInputElement;

    expect(autoUpdateSwitch.checked).toBe(false);
    expect(notificationsSwitch.checked).toBe(true);
  });

  it('renders Llama-Server Path with correct value', () => {
    const config = {
      ...defaultFormConfig,
      llamaServerPath: '/custom/path/to/llama-server',
    };
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={config}
        onInputChange={mockOnInputChange}
        fieldErrors={{}}
      />,
    );
    const input = screen.getByLabelText('Llama-Server Path');
    expect(input).toHaveValue('/custom/path/to/llama-server');
  });

  it('renders single model mode alert when maxConcurrentModels is 1', () => {
    const singleModelConfig = {
      ...defaultFormConfig,
      maxConcurrentModels: 1,
    };
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={singleModelConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );

    expect(screen.getByText('Single Model Mode:')).toBeInTheDocument();
    expect(
      screen.getByText('Only one model can be loaded at a time.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Loading a new model will require stopping currently running one first.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Change "Max Concurrent Models" to a higher value for parallel loading.',
      ),
    ).toBeInTheDocument();
  });

  it('shows single model mode helper text when maxConcurrentModels is 1', () => {
    const singleModelConfig = {
      ...defaultFormConfig,
      maxConcurrentModels: 1,
    };
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={singleModelConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );

    const maxConcurrentInput = screen.getByLabelText('Max Concurrent Models');
    const helperText = screen.getByText(
      'Single model mode: Only one model loaded at a time',
    );
    expect(helperText).toBeInTheDocument();
  });

  it('shows parallel mode helper text when maxConcurrentModels > 1', () => {
    renderWithTheme(
      <GeneralSettingsTab
        formConfig={defaultFormConfig}
        onInputChange={mockOnInputChange}
        fieldErrors={defaultFieldErrors}
      />,
    );

    const helperText = screen.getByText(
      'Parallel mode: Multiple models can be loaded simultaneously',
    );
    expect(helperText).toBeInTheDocument();
  });
});
