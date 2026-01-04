import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  getModernConfiguration,
  createDefaultHookValue,
  mockHandleTabChange,
  mockHandleInputChange,
  mockHandleLlamaServerChange,
  mockHandleReset,
  mockHandleSync,
} from './test-utils';

describe('ModernConfiguration - Initial Render', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    useConfigurationForm.mockReturnValue(createDefaultHookValue());
  });

  it('renders without errors when not loading', () => {
    render(getModernConfiguration());

    expect(screen.getByTestId('configuration-header')).toBeInTheDocument();
    expect(screen.getByTestId('configuration-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('status-messages')).toBeInTheDocument();
    expect(screen.getByTestId('configuration-actions')).toBeInTheDocument();
  });

  it('shows General Settings tab by default (activeTab 0)', () => {
    render(getModernConfiguration());

    expect(screen.getByTestId('general-settings-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('llama-server-settings-tab')).not.toBeInTheDocument();
    expect(screen.queryByTestId('advanced-settings-tab')).not.toBeInTheDocument();
    expect(screen.queryByTestId('logger-settings-tab')).not.toBeInTheDocument();
  });

  it('initializes with correct default values from hook', () => {
    render(getModernConfiguration());

    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    expect(useConfigurationForm).toHaveBeenCalled();
  });
});

describe('ModernConfiguration - Tab Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    useConfigurationForm.mockReturnValue(createDefaultHookValue());
  });

  it('switches to Llama Server Settings tab (tab 1)', async () => {
    render(getModernConfiguration());

    const llamaServerButton = screen.getByText('Llama Server');
    fireEvent.click(llamaServerButton);

    await waitFor(() => {
      expect(mockHandleTabChange).toHaveBeenCalledWith(1);
    });
  });

  it('switches to Advanced Settings tab (tab 2)', async () => {
    render(getModernConfiguration());

    const advancedButton = screen.getByText('Advanced');
    fireEvent.click(advancedButton);

    await waitFor(() => {
      expect(mockHandleTabChange).toHaveBeenCalledWith(2);
    });
  });

  it('switches to Logger Settings tab (tab 3)', async () => {
    render(getModernConfiguration());

    const loggerButton = screen.getByText('Logger');
    fireEvent.click(loggerButton);

    await waitFor(() => {
      expect(mockHandleTabChange).toHaveBeenCalledWith(3);
    });
  });
});

describe('ModernConfiguration - Tab Content Interaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    useConfigurationForm.mockReturnValue(createDefaultHookValue());
  });

  it('handles input changes in General Settings tab', async () => {
    render(getModernConfiguration());

    const changeButton = screen.getByText('Change Input');
    fireEvent.click(changeButton);

    await waitFor(() => {
      expect(mockHandleInputChange).toHaveBeenCalledWith('test', 'value');
    });
  });

  it('handles Llama Server changes', async () => {
    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    useConfigurationForm.mockReturnValue({
      ...createDefaultHookValue(),
      activeTab: 1,
    });

    render(getModernConfiguration());

    const serverButton = screen.getByText('Change Server');
    fireEvent.click(serverButton);

    await waitFor(() => {
      expect(mockHandleLlamaServerChange).toHaveBeenCalledWith('host', 'localhost');
    });
  });

  it('handles reset action in Advanced Settings tab', async () => {
    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    useConfigurationForm.mockReturnValue({
      ...createDefaultHookValue(),
      activeTab: 2,
    });

    render(getModernConfiguration());

    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(mockHandleReset).toHaveBeenCalled();
    });
  });

  it('handles sync action in Advanced Settings tab', async () => {
    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    useConfigurationForm.mockReturnValue({
      ...createDefaultHookValue(),
      activeTab: 2,
    });

    render(getModernConfiguration());

    const syncButton = screen.getByText('Sync');
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(mockHandleSync).toHaveBeenCalled();
    });
  });
});
