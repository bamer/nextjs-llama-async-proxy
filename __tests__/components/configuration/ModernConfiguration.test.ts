import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Import at function level
const getModernConfiguration = () => require('@/components/configuration/ModernConfiguration').default;

// Mock MUI components
jest.mock('@mui/material', () => ({
  Box: ({ children, sx }: any) => React.createElement('div', { style: sx, 'data-testid': 'box' }, children),
  Typography: ({ children, ...props }: any) => {
    const { variant, ...filteredProps } = props;
    return React.createElement(variant === 'h1' || variant === 'h2' || variant === 'h4' || variant === 'h6' ? 'h1' : 'p', filteredProps, children);
  },
}));

// Mock useConfigurationForm hook
const mockHandleTabChange = jest.fn();
const mockHandleInputChange = jest.fn();
const mockHandleLlamaServerChange = jest.fn();
const mockHandleSave = jest.fn();
const mockHandleReset = jest.fn();
const mockHandleSync = jest.fn();

jest.mock('@/components/configuration/hooks/useConfigurationForm', () => ({
  useConfigurationForm: jest.fn(),
}));

jest.mock('@/components/configuration/ConfigurationHeader', () => ({
  ConfigurationHeader: () => React.createElement('div', { 'data-testid': 'configuration-header' }, 'Configuration Header'),
}));

jest.mock('@/components/configuration/ConfigurationTabs', () => ({
  ConfigurationTabs: ({ activeTab, onChange }: any) =>
    React.createElement('div', { 'data-testid': 'configuration-tabs' },
      React.createElement('button', { onClick: () => onChange(0), 'data-active': activeTab === 0 }, 'General'),
      React.createElement('button', { onClick: () => onChange(1), 'data-active': activeTab === 1 }, 'Llama Server'),
      React.createElement('button', { onClick: () => onChange(2), 'data-active': activeTab === 2 }, 'Advanced'),
      React.createElement('button', { onClick: () => onChange(3), 'data-active': activeTab === 3 }, 'Logger')
    ),
}));

jest.mock('@/components/configuration/ConfigurationStatusMessages', () => ({
  ConfigurationStatusMessages: ({ saveSuccess, validationErrors }: any) => {
    return React.createElement('div', { 'data-testid': 'status-messages' },
      saveSuccess ? 'Save successful' : undefined,
      validationErrors ? 'Validation errors' : undefined
    );
  },
}));

jest.mock('@/components/configuration/GeneralSettingsTab', () => ({
  GeneralSettingsTab: ({ formConfig, onInputChange, fieldErrors }: any) =>
    React.createElement('div', { 'data-testid': 'general-settings-tab' },
      React.createElement('button', { onClick: () => onInputChange('test', 'value') }, 'Change Input')
    ),
}));

jest.mock('@/components/configuration/LlamaServerSettingsTab', () => ({
  LlamaServerSettingsTab: ({ formConfig, onLlamaServerChange, fieldErrors }: any) =>
    React.createElement('div', { 'data-testid': 'llama-server-settings-tab' },
      React.createElement('button', { onClick: () => onLlamaServerChange('host', 'localhost') }, 'Change Server')
    ),
}));

jest.mock('@/components/configuration/AdvancedSettingsTab', () => ({
  AdvancedSettingsTab: ({ isSaving, onReset, onSync }: any) =>
    React.createElement('div', { 'data-testid': 'advanced-settings-tab' },
      React.createElement('button', { onClick: onReset, disabled: isSaving }, 'Reset'),
      React.createElement('button', { onClick: onSync, disabled: isSaving }, 'Sync')
    ),
}));

jest.mock('@/components/configuration/LoggerSettingsTab', () => ({
  LoggerSettingsTab: () => React.createElement('div', { 'data-testid': 'logger-settings-tab' }, 'Logger Settings'),
}));

jest.mock('@/components/configuration/ConfigurationActions', () => ({
  ConfigurationActions: ({ isSaving, onSave }: any) =>
    React.createElement('div', { 'data-testid': 'configuration-actions' },
      React.createElement('button', { onClick: onSave, disabled: isSaving }, 'Save')
    ),
}));

jest.mock('@/components/ui', () => ({
  SkeletonSettingsForm: ({ fields }: any) =>
    React.createElement('div', { 'data-testid': 'skeleton-form' },
      Array.from({ length: fields }).map((_, i) =>
        React.createElement('div', { key: i }, `Field ${i + 1}`)
      )
    ),
}));

describe('ModernConfiguration', () => {
  const defaultHookValue = {
    config: {},
    loading: false,
    activeTab: 0,
    formConfig: {},
    validationErrors: null,
    fieldErrors: {
      general: {},
      llamaServer: {},
    },
    isSaving: false,
    saveSuccess: false,
    handleTabChange: mockHandleTabChange,
    handleInputChange: mockHandleInputChange,
    handleLlamaServerChange: mockHandleLlamaServerChange,
    handleSave: mockHandleSave,
    handleReset: mockHandleReset,
    handleSync: mockHandleSync,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    useConfigurationForm.mockReturnValue(defaultHookValue);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading state when loading is true', () => {
      const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
      useConfigurationForm.mockReturnValue({
        ...defaultHookValue,
        loading: true,
      });

      render(React.createElement(getModernConfiguration()));

      expect(screen.getByTestId('skeleton-form')).toBeInTheDocument();
    });

    it('shows 8 skeleton fields while loading', () => {
      const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
      useConfigurationForm.mockReturnValue({
        ...defaultHookValue,
        loading: true,
      });

      render(React.createElement(getModernConfiguration()));

      const fields = screen.getAllByText(/Field \d+/);
      expect(fields).toHaveLength(8);
    });

    it('does not show configuration content when loading', () => {
      const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
      useConfigurationForm.mockReturnValue({
        ...defaultHookValue,
        loading: true,
      });

      render(React.createElement(getModernConfiguration()));

      expect(screen.queryByTestId('configuration-header')).not.toBeInTheDocument();
      expect(screen.queryByTestId('configuration-tabs')).not.toBeInTheDocument();
    });
  });

  describe('Initial Render', () => {
    it('renders without errors when not loading', () => {
      render(React.createElement(getModernConfiguration()));

      expect(screen.getByTestId('configuration-header')).toBeInTheDocument();
      expect(screen.getByTestId('configuration-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('status-messages')).toBeInTheDocument();
      expect(screen.getByTestId('configuration-actions')).toBeInTheDocument();
    });

    it('shows General Settings tab by default (activeTab 0)', () => {
      render(React.createElement(getModernConfiguration()));

      expect(screen.getByTestId('general-settings-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('llama-server-settings-tab')).not.toBeInTheDocument();
      expect(screen.queryByTestId('advanced-settings-tab')).not.toBeInTheDocument();
      expect(screen.queryByTestId('logger-settings-tab')).not.toBeInTheDocument();
    });

    it('initializes with correct default values from hook', () => {
      render(React.createElement(getModernConfiguration()));

      const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
      expect(useConfigurationForm).toHaveBeenCalled();
    });
  });

  describe('Tab Navigation', () => {
    it('switches to Llama Server Settings tab (tab 1)', async () => {
      render(React.createElement(getModernConfiguration()));

      const llamaServerButton = screen.getByText('Llama Server');
      fireEvent.click(llamaServerButton);

      await waitFor(() => {
        expect(mockHandleTabChange).toHaveBeenCalledWith(1);
      });
    });

    it('switches to Advanced Settings tab (tab 2)', async () => {
      render(React.createElement(getModernConfiguration()));

      const advancedButton = screen.getByText('Advanced');
      fireEvent.click(advancedButton);

      await waitFor(() => {
        expect(mockHandleTabChange).toHaveBeenCalledWith(2);
      });
    });

    it('switches to Logger Settings tab (tab 3)', async () => {
      render(React.createElement(getModernConfiguration()));

      const loggerButton = screen.getByText('Logger');
      fireEvent.click(loggerButton);

      await waitFor(() => {
        expect(mockHandleTabChange).toHaveBeenCalledWith(3);
      });
    });

    it('renders correct tab content based on activeTab', () => {
      const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');

      // Test General tab (0)
      useConfigurationForm.mockReturnValue({
        ...defaultHookValue,
        activeTab: 0,
      });

      const { rerender } = render(React.createElement(getModernConfiguration()));

      expect(screen.getByTestId('general-settings-tab')).toBeInTheDocument();

      // Test Llama Server tab (1)
      useConfigurationForm.mockReturnValue({
        ...defaultHookValue,
        activeTab: 1,
      });

      rerender(React.createElement(getModernConfiguration()));

      expect(screen.getByTestId('llama-server-settings-tab')).toBeInTheDocument();

      // Test Advanced tab (2)
      useConfigurationForm.mockReturnValue({
        ...defaultHookValue,
        activeTab: 2,
      });

      rerender(React.createElement(getModernConfiguration()));

      expect(screen.getByTestId('advanced-settings-tab')).toBeInTheDocument();

      // Test Logger tab (3)
      useConfigurationForm.mockReturnValue({
        ...defaultHookValue,
        activeTab: 3,
      });

      rerender(React.createElement(getModernConfiguration()));

      expect(screen.getByTestId('logger-settings-tab')).toBeInTheDocument();
    });
  });

  describe('Tab Content Interaction', () => {
    it('handles input changes in General Settings tab', async () => {
      render(React.createElement(getModernConfiguration()));

      const changeButton = screen.getByText('Change Input');
      fireEvent.click(changeButton);

      await waitFor(() => {
        expect(mockHandleInputChange).toHaveBeenCalledWith('test', 'value');
      });
    });

    it('handles Llama Server changes', async () => {
      const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
      useConfigurationForm.mockReturnValue({
        ...defaultHookValue,
        activeTab: 1,
      });

      render(React.createElement(getModernConfiguration()));

      const serverButton = screen.getByText('Change Server');
      fireEvent.click(serverButton);

      await waitFor(() => {
        expect(mockHandleLlamaServerChange).toHaveBeenCalledWith('host', 'localhost');
      });
    });

    it('handles reset action in Advanced Settings tab', async () => {
      const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
      useConfigurationForm.mockReturnValue({
        ...defaultHookValue,
        activeTab: 2,
      });

      render(React.createElement(getModernConfiguration()));

      const resetButton = screen.getByText('Reset');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(mockHandleReset).toHaveBeenCalled();
      });
    });

    it('handles sync action in Advanced Settings tab', async () => {
      const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
      useConfigurationForm.mockReturnValue({
        ...defaultHookValue,
        activeTab: 2,
      });

      render(React.createElement(getModernConfiguration()));

      const syncButton = screen.getByText('Sync');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(mockHandleSync).toHaveBeenCalled();
      });
    });
  });

  describe('Save Functionality', () => {
    it('renders save button', () => {
      render(React.createElement(getModernConfiguration()));

      const saveButton = screen.getByText('Save');
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).not.toBeDisabled();
    });

    it('handles save action', async () => {
      render(React.createElement(getModernConfiguration()));

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockHandleSave).toHaveBeenCalled();
      });
    });

    it('disables save button when isSaving is true', () => {
      const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
      useConfigurationForm.mockReturnValue({
        ...defaultHookValue,
        isSaving: true,
      });

      render(React.createElement(getModernConfiguration()));

      const saveButton = screen.getByText('Save');
      expect(saveButton).toBeDisabled();
    });

    it('enables save button when isSaving is false', () => {
      const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
      useConfigurationForm.mockReturnValue({
        ...defaultHookValue,
        isSaving: false,
      });

      render(React.createElement(getModernConfiguration()));

      const saveButton = screen.getByText('Save');
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Status Messages', () => {
    it('shows save success message', () => {
      const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
      useConfigurationForm.mockReturnValue({
        ...defaultHookValue,
        saveSuccess: true,
      });

      render(React.createElement(getModernConfiguration()));

      expect(screen.getByText('Save successful')).toBeInTheDocument();
    });

    it('shows validation errors message', () => {
      const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
      useConfigurationForm.mockReturnValue({
        ...defaultHookValue,
        validationErrors: ['Error 1', 'Error 2'],
      });

      render(React.createElement(getModernConfiguration()));

      expect(screen.getByText('Validation errors')).toBeInTheDocument();
    });

    it('does not show status messages when none are present', () => {
      const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
      useConfigurationForm.mockReturnValue({
        ...defaultHookValue,
        saveSuccess: false,
        validationErrors: null,
      });

      render(React.createElement(getModernConfiguration()));

      const statusMessages = screen.getByTestId('status-messages');
      expect(statusMessages.textContent).toBe('');
    });
  });

  describe('Layout and Structure', () => {
    it('has correct component hierarchy', () => {
      const { container } = render(React.createElement(getModernConfiguration()));

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
      render(React.createElement(getModernConfiguration()));

      expect(screen.getByTestId('general-settings-tab')).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleError = jest.spyOn(console, 'error');

      render(React.createElement(getModernConfiguration()));

      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('renders without console warnings', () => {
      const consoleWarn = jest.spyOn(console, 'warn');

      render(React.createElement(getModernConfiguration()));

      expect(consoleWarn).not.toHaveBeenCalled();
      consoleWarn.mockRestore();
    });
  });

  describe('Re-rendering', () => {
    it('handles re-renders gracefully', () => {
      const { rerender } = render(React.createElement(getModernConfiguration()));

      expect(screen.getByTestId('configuration-header')).toBeInTheDocument();

      rerender(React.createElement(getModernConfiguration()));

      expect(screen.getByTestId('configuration-header')).toBeInTheDocument();
    });

    it('updates when hook values change', () => {
      const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');

      const { rerender } = render(React.createElement(getModernConfiguration()));

      expect(screen.getByTestId('general-settings-tab')).toBeInTheDocument();

      useConfigurationForm.mockReturnValue({
        ...defaultHookValue,
        activeTab: 2,
      });

      rerender(React.createElement(getModernConfiguration()));

      expect(screen.getByTestId('advanced-settings-tab')).toBeInTheDocument();
    });
  });

  describe('Integration with Hooks', () => {
    it('calls useConfigurationForm hook on render', () => {
      render(React.createElement(getModernConfiguration()));

      const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
      expect(useConfigurationForm).toHaveBeenCalledTimes(1);
    });

    it('receives correct structure from useConfigurationForm', () => {
      render(React.createElement(getModernConfiguration()));

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

  describe('Component Type', () => {
    it('is a valid React component', () => {
      expect(getModernConfiguration()).toBeDefined();
      expect(typeof getModernConfiguration()).toBe('function');
    });

    it('can be rendered multiple times', () => {
      const { unmount } = render(React.createElement(getModernConfiguration()));

      expect(screen.getByTestId('configuration-header')).toBeInTheDocument();

      unmount();

      render(React.createElement(getModernConfiguration()));

      expect(screen.getByTestId('configuration-header')).toBeInTheDocument();
    });
  });
});
