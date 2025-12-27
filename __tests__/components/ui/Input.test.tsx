import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Input, TextArea, Select, Label } from '@/components/ui/Input';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('framer-motion', () => ({
  m: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('Input', () => {
  it('renders correctly', () => {
    renderWithTheme(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('applies placeholder', () => {
    renderWithTheme(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    renderWithTheme(<Input value="initial" onChange={handleChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays initial value', () => {
    renderWithTheme(<Input value="test value" />);
    expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    renderWithTheme(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = renderWithTheme(<Input className="custom-class" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('custom-class');
  });

  it('has base styling classes', () => {
    const { container } = renderWithTheme(<Input />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('bg-input', 'border', 'rounded-md');
  });

  it('has focus ring classes', () => {
    const { container } = renderWithTheme(<Input />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('focus:ring-2', 'focus:ring-primary');
  });

  it('handles type prop', () => {
    const { container } = renderWithTheme(<Input type="number" />);
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('handles name prop', () => {
    const { container } = renderWithTheme(<Input name="username" />);
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('name', 'username');
  });

  it('handles id prop', () => {
    const { container } = renderWithTheme(<Input id="test-id" />);
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('id', 'test-id');
  });

  it('handles required prop', () => {
    renderWithTheme(<Input required />);
    expect(screen.getByRole('textbox')).toBeRequired();
  });
});

describe('TextArea', () => {
  it('renders correctly', () => {
    renderWithTheme(<TextArea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('applies placeholder', () => {
    renderWithTheme(<TextArea placeholder="Enter description" />);
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    renderWithTheme(<TextArea value="initial" onChange={handleChange} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays initial value', () => {
    renderWithTheme(<TextArea value="test value" onChange={jest.fn()} />);
    expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    renderWithTheme(<TextArea disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = renderWithTheme(<TextArea className="custom-class" />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveClass('custom-class');
  });

  it('has base styling classes', () => {
    const { container } = renderWithTheme(<TextArea />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveClass('bg-input', 'border', 'rounded-md');
  });

  it('handles rows prop', () => {
    const { container } = renderWithTheme(<TextArea rows={5} />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveAttribute('rows', '5');
  });
});

describe('Select', () => {
  it('renders correctly', () => {
    renderWithTheme(
      <Select>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders children options', () => {
    renderWithTheme(
      <Select>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    );
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    renderWithTheme(
      <Select value="1" onChange={handleChange}>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    );
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('can be disabled', () => {
    renderWithTheme(
      <Select disabled>
        <option>Option</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = renderWithTheme(
      <Select className="custom-class">
        <option>Option</option>
      </Select>
    );
    const select = container.querySelector('select');
    expect(select).toHaveClass('custom-class');
  });

  it('has base styling classes', () => {
    const { container } = renderWithTheme(
      <Select>
        <option>Option</option>
      </Select>
    );
    const select = container.querySelector('select');
    expect(select).toHaveClass('bg-input', 'border', 'rounded-md');
  });

  it('handles name prop', () => {
    const { container } = renderWithTheme(
      <Select name="choice">
        <option>Option</option>
      </Select>
    );
    const select = container.querySelector('select');
    expect(select).toHaveAttribute('name', 'choice');
  });
});

describe('Label', () => {
  it('renders correctly', () => {
    renderWithTheme(<Label>Field Label</Label>);
    expect(screen.getByText('Field Label')).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    renderWithTheme(<Label><span>Icon</span> Label</Label>);
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Label')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithTheme(<Label className="custom-class">Label</Label>);
    const label = container.querySelector('label');
    expect(label).toHaveClass('custom-class');
  });

  it('has base styling classes', () => {
    const { container } = renderWithTheme(<Label>Label</Label>);
    const label = container.querySelector('label');
    expect(label).toHaveClass('text-foreground');
  });

  it('handles htmlFor prop', () => {
    const { container } = renderWithTheme(<Label htmlFor="input-id">Label</Label>);
    const label = container.querySelector('label');
    expect(label).toHaveAttribute('for', 'input-id');
  });
});
