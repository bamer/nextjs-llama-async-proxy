/**
 * Tests for MultiSelect component
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MultiSelect, MultiSelectOption } from '@/components/ui';

describe('MultiSelect Component', () => {
  const defaultOptions: MultiSelectOption[] = [
    { value: 'error', label: 'Error', color: '#f44336' },
    { value: 'warn', label: 'Warning', color: '#ff9800' },
    { value: 'info', label: 'Info', color: '#2196f3' },
    { value: 'debug', label: 'Debug', color: '#4caf50' },
  ];

  describe('Rendering', () => {
    it('should render with placeholder when nothing selected', () => {
      const mockOnChange = jest.fn();
      render(
        <MultiSelect
          options={defaultOptions}
          selected={new Set()}
          onChange={mockOnChange}
          placeholder="Select options..."
        />
      );

      expect(screen.getByText('Select options...')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      const mockOnChange = jest.fn();
      render(
        <MultiSelect
          label="Log Levels"
          options={defaultOptions}
          selected={new Set(['error'])}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Log Levels')).toBeInTheDocument();
    });

    it('should render all options', () => {
      const mockOnChange = jest.fn();
      render(
        <MultiSelect
          options={defaultOptions}
          selected={new Set()}
          onChange={mockOnChange}
        />
      );

      // Open the select
      const select = screen.getByRole('button');
      fireEvent.mouseDown(select);

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Debug')).toBeInTheDocument();
    });
  });

  describe('Selection Display', () => {
    it('should show selected items as chips when within maxSelectedDisplay', () => {
      const mockOnChange = jest.fn();
      const selected = new Set(['error', 'warn']);
      render(
        <MultiSelect
          options={defaultOptions}
          selected={selected}
          onChange={mockOnChange}
          maxSelectedDisplay={3}
        />
      );

      const errorChip = screen.getByText('Error');
      const warnChip = screen.getByText('Warning');

      expect(errorChip).toBeInTheDocument();
      expect(warnChip).toBeInTheDocument();
    });

    it('should show count when selected exceeds maxSelectedDisplay', () => {
      const mockOnChange = jest.fn();
      const selected = new Set(['error', 'warn', 'info', 'debug']);
      render(
        <MultiSelect
          options={defaultOptions}
          selected={selected}
          onChange={mockOnChange}
          maxSelectedDisplay={2}
        />
      );

      expect(screen.getByText('4 selected')).toBeInTheDocument();
    });

    it('should show all items when displayAllWhenFull is true', () => {
      const mockOnChange = jest.fn();
      const selected = new Set(['error', 'warn', 'info', 'debug']);
      render(
        <MultiSelect
          options={defaultOptions}
          selected={selected}
          onChange={mockOnChange}
          maxSelectedDisplay={2}
          displayAllWhenFull={true}
        />
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Debug')).toBeInTheDocument();
    });

    it('should color chips with option colors', () => {
      const mockOnChange = jest.fn();
      const selected = new Set(['error']);
      render(
        <MultiSelect
          options={defaultOptions}
          selected={selected}
          onChange={mockOnChange}
        />
      );

      const errorChip = screen.getByText('Error');
      expect(errorChip).toHaveStyle({ backgroundColor: '#f44336' });
    });
  });

  describe('Selection Logic', () => {
    it('should call onChange with new selection when clicking option', () => {
      const mockOnChange = jest.fn();
      const selected = new Set(['error']);

      render(
        <MultiSelect
          options={defaultOptions}
          selected={selected}
          onChange={mockOnChange}
        />
      );

      // Open the select
      const select = screen.getByRole('button');
      fireEvent.mouseDown(select);

      // Click on 'Warning' option
      const warnOption = screen.getByText('Warning');
      fireEvent.click(warnOption);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      const newSelected = mockOnChange.mock.calls[0][0];
      expect(newSelected.has('warn')).toBe(true);
      expect(newSelected.has('error')).toBe(true);
    });

    it('should remove selection when clicking already selected option', () => {
      const mockOnChange = jest.fn();
      const selected = new Set(['error', 'warn']);

      render(
        <MultiSelect
          options={defaultOptions}
          selected={selected}
          onChange={mockOnChange}
        />
      );

      // Open the select
      const select = screen.getByRole('button');
      fireEvent.mouseDown(select);

      // Click on 'Error' option (already selected)
      const errorOption = screen.getByText('Error');
      fireEvent.click(errorOption);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      const newSelected = mockOnChange.mock.calls[0][0];
      expect(newSelected.has('error')).toBe(false);
      expect(newSelected.has('warn')).toBe(true);
    });
  });

  describe('Select All / Deselect All', () => {
    it('should show "Select All" option when showSelectAll is true', () => {
      const mockOnChange = jest.fn();
      render(
        <MultiSelect
          options={defaultOptions}
          selected={new Set()}
          onChange={mockOnChange}
          showSelectAll={true}
        />
      );

      // Open the select
      const select = screen.getByRole('button');
      fireEvent.mouseDown(select);

      expect(screen.getByText('Select All')).toBeInTheDocument();
    });

    it('should not show "Select All" option when showSelectAll is false', () => {
      const mockOnChange = jest.fn();
      render(
        <MultiSelect
          options={defaultOptions}
          selected={new Set()}
          onChange={mockOnChange}
          showSelectAll={false}
        />
      );

      // Open the select
      const select = screen.getByRole('button');
      fireEvent.mouseDown(select);

      expect(screen.queryByText('Select All')).not.toBeInTheDocument();
    });

    it('should not show "Select All" when only one option', () => {
      const mockOnChange = jest.fn();
      const singleOption = [{ value: 'error', label: 'Error', color: '#f44336' }];

      render(
        <MultiSelect
          options={singleOption}
          selected={new Set()}
          onChange={mockOnChange}
          showSelectAll={true}
        />
      );

      // Open the select
      const select = screen.getByRole('button');
      fireEvent.mouseDown(select);

      expect(screen.queryByText('Select All')).not.toBeInTheDocument();
    });

    it('should select all options when clicking "Select All"', () => {
      const mockOnChange = jest.fn();
      const selected = new Set(['error']);

      render(
        <MultiSelect
          options={defaultOptions}
          selected={selected}
          onChange={mockOnChange}
          showSelectAll={true}
        />
      );

      // Open the select
      const select = screen.getByRole('button');
      fireEvent.mouseDown(select);

      // Click "Select All"
      const selectAllOption = screen.getByText('Select All');
      fireEvent.click(selectAllOption);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      const newSelected = mockOnChange.mock.calls[0][0];
      expect(newSelected.size).toBe(4);
      expect(newSelected.has('error')).toBe(true);
      expect(newSelected.has('warn')).toBe(true);
      expect(newSelected.has('info')).toBe(true);
      expect(newSelected.has('debug')).toBe(true);
    });

    it('should deselect all options when clicking "Deselect All"', () => {
      const mockOnChange = jest.fn();
      const selected = new Set(['error', 'warn', 'info', 'debug']);

      render(
        <MultiSelect
          options={defaultOptions}
          selected={selected}
          onChange={mockOnChange}
          showSelectAll={true}
        />
      );

      // Open the select
      const select = screen.getByRole('button');
      fireEvent.mouseDown(select);

      // Click "Deselect All"
      const deselectAllOption = screen.getByText('Deselect All');
      fireEvent.click(deselectAllOption);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      const newSelected = mockOnChange.mock.calls[0][0];
      expect(newSelected.size).toBe(0);
    });

    it('should show indeterminate checkbox when some options selected', () => {
      const mockOnChange = jest.fn();
      const selected = new Set(['error', 'warn']);

      render(
        <MultiSelect
          options={defaultOptions}
          selected={selected}
          onChange={mockOnChange}
          showSelectAll={true}
        />
      );

      // Open the select
      const select = screen.getByRole('button');
      fireEvent.mouseDown(select);

      const selectAllCheckbox = within(screen.getByText('Select All').closest('li')!).getByRole('checkbox');
      expect(selectAllCheckbox).toHaveProperty('indeterminate', true);
    });
  });

  describe('Disabled State', () => {
    it('should not open when disabled', () => {
      const mockOnChange = jest.fn();
      render(
        <MultiSelect
          options={defaultOptions}
          selected={new Set()}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const select = screen.getByRole('button');
      expect(select).toHaveAttribute('disabled');
    });
  });

  describe('Size Variants', () => {
    it('should render small size', () => {
      const mockOnChange = jest.fn();
      render(
        <MultiSelect
          options={defaultOptions}
          selected={new Set()}
          onChange={mockOnChange}
          size="small"
        />
      );

      const select = screen.getByRole('button');
      expect(select).toBeInTheDocument();
    });

    it('should render medium size', () => {
      const mockOnChange = jest.fn();
      render(
        <MultiSelect
          options={defaultOptions}
          selected={new Set()}
          onChange={mockOnChange}
          size="medium"
        />
      );

      const select = screen.getByRole('button');
      expect(select).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom sx prop', () => {
      const mockOnChange = jest.fn();
      render(
        <MultiSelect
          options={defaultOptions}
          selected={new Set()}
          onChange={mockOnChange}
          sx={{ minWidth: 300, marginTop: 2 }}
        />
      );

      const container = screen.getByText('Select...').closest('.MuiFormControl-root');
      expect(container).toHaveStyle({ minWidth: '300px', marginTop: '8px' });
    });
  });

  describe('Generic Type Support', () => {
    it('should work with string values', () => {
      const mockOnChange = jest.fn();
      render(
        <MultiSelect<string>
          options={defaultOptions}
          selected={new Set(['error'])}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should work with number values', () => {
      const mockOnChange = jest.fn();
      const numericOptions: MultiSelectOption<number>[] = [
        { value: 1, label: 'One' },
        { value: 2, label: 'Two' },
      ];

      render(
        <MultiSelect<number>
          options={numericOptions}
          selected={new Set([1])}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('One')).toBeInTheDocument();
    });
  });
});
