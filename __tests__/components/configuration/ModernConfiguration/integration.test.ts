import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  getModernConfiguration,
  createDefaultHookValue,
} from './test-utils';

describe('ModernConfiguration - Layout and Structure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    useConfigurationForm.mockReturnValue(createDefaultHookValue());
  });

  it('has correct component hierarchy', () => {
    const { container } = render(getModernConfiguration());

    const header = screen.getByTestId('configuration-header');
    const tabs = screen.getByTestId('configuration-tabs');
    const status = screen.getByTestId('status-messages');
    const actions = screen.getByTestId('configuration-actions');

    expect(header).toBeInTheDocument();
    expect(tabs).toBeInTheDocument();
    expect(status).toBeInTheDocument();
    expect(actions).toBeInTheDocument();
  });

  it('has tab content rendered', () => {
    render(getModernConfiguration());

    expect(screen.getByTestId('general-settings-tab')).toBeInTheDocument();
  });

  it('renders without console errors', () => {
    const consoleError = jest.spyOn(console, 'error');

    render(getModernConfiguration());

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders without console warnings', () => {
    const consoleWarn = jest.spyOn(console, 'warn');

    render(getModernConfiguration());

    expect(consoleWarn).not.toHaveBeenCalled();
    consoleWarn.mockRestore();
  });
});

describe('ModernConfiguration - Re-rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    useConfigurationForm.mockReturnValue(createDefaultHookValue());
  });

  it('handles re-renders gracefully', () => {
    const { rerender } = render(getModernConfiguration());

    expect(screen.getByTestId('configuration-header')).toBeInTheDocument();

    rerender(getModernConfiguration());

    expect(screen.getByTestId('configuration-header')).toBeInTheDocument();
  });

  it('updates when hook values change', () => {
    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');

    const { rerender } = render(getModernConfiguration());

    expect(screen.getByTestId('general-settings-tab')).toBeInTheDocument();

    useConfigurationForm.mockReturnValue({
      ...createDefaultHookValue(),
      activeTab: 2,
    });

    rerender(getModernConfiguration());

    expect(screen.getByTestId('advanced-settings-tab')).toBeInTheDocument();
  });
});

describe('ModernConfiguration - Integration with Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    useConfigurationForm.mockReturnValue(createDefaultHookValue());
  });

  it('calls useConfigurationForm hook on render', () => {
    render(getModernConfiguration());

    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    expect(useConfigurationForm).toHaveBeenCalledTimes(1);
  });

  it('receives correct structure from useConfigurationForm', () => {
    render(getModernConfiguration());

    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    const returnValue = useConfigurationForm.mock.results[0].value;

    expect(returnValue).toHaveProperty('config');
    expect(returnValue).toHaveProperty('loading');
    expect(returnValue).toHaveProperty('activeTab');
    expect(returnValue).toHaveProperty('formConfig');
    expect(returnValue).toHaveProperty('validationErrors');
    expect(returnValue).toHaveProperty('fieldErrors');
    expect(returnValue).toHaveProperty('isSaving');
    expect(returnValue).toHaveProperty('saveSuccess');
    expect(returnValue).toHaveProperty('handleTabChange');
    expect(returnValue).toHaveProperty('handleInputChange');
    expect(returnValue).toHaveProperty('handleLlamaServerChange');
    expect(returnValue).toHaveProperty('handleSave');
    expect(returnValue).toHaveProperty('handleReset');
    expect(returnValue).toHaveProperty('handleSync');
  });
});

describe('ModernConfiguration - Component Type', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is a valid React component', () => {
    expect(getModernConfiguration()).toBeDefined();
    expect(typeof getModernConfiguration()).toBe('function');
  });

  it('can be rendered multiple times', () => {
    const { unmount } = render(getModernConfiguration());

    expect(screen.getByTestId('configuration-header')).toBeInTheDocument();

    unmount();

    render(getModernConfiguration());

    expect(screen.getByTestId('configuration-header')).toBeInTheDocument();
  });
});
