import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  getModernConfiguration,
  createDefaultHookValue,
  mockHandleTabChange,
} from './test-utils';

describe('ModernConfiguration - Loading State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useConfigurationForm } = require('@/components/configuration/hooks/useConfigurationForm');
    useConfigurationForm.mockReturnValue({
      ...createDefaultHookValue(),
      loading: true,
    });
  });

  it('shows loading state when loading is true', () => {
    render(getModernConfiguration());

    expect(screen.getByTestId('skeleton-form')).toBeInTheDocument();
  });

  it('shows 8 skeleton fields while loading', () => {
    render(getModernConfiguration());

    const fields = screen.getAllByText(/Field \d+/);
    expect(fields).toHaveLength(8);
  });

  it('does not show configuration content when loading', () => {
    render(getModernConfiguration());

    expect(screen.queryByTestId('configuration-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('configuration-tabs')).not.toBeInTheDocument();
  });
});
