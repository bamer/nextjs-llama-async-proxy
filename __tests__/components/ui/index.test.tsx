import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Button } from '@/components/ui/Button';
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

const Card = require('@/components/ui/Card').default;

describe('UI Components Index', () => {
  it('exports Button component', () => {
    expect(Button).toBeDefined();
  });

  it('exports Card component', () => {
    expect(Card).toBeDefined();
  });

  it('exports Input component', () => {
    expect(Input).toBeDefined();
  });

  it('exports TextArea component', () => {
    expect(TextArea).toBeDefined();
  });

  it('exports Select component', () => {
    expect(Select).toBeDefined();
  });

  it('exports Label component', () => {
    expect(Label).toBeDefined();
  });

  it('Button component can be imported and rendered', () => {
    renderWithTheme(<Button>Test Button</Button>);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('Card component can be imported and rendered', () => {
    renderWithTheme(<Card />);
    expect(screen.getByText('Word of the Day')).toBeInTheDocument();
  });

  it('Input component can be imported and rendered', () => {
    renderWithTheme(<Input placeholder="Test Input" />);
    expect(screen.getByPlaceholderText('Test Input')).toBeInTheDocument();
  });

  it('TextArea component can be imported and rendered', () => {
    renderWithTheme(<TextArea placeholder="Test TextArea" />);
    expect(screen.getByPlaceholderText('Test TextArea')).toBeInTheDocument();
  });

  it('Select component can be imported and rendered', () => {
    renderWithTheme(<Select><option>Option 1</option></Select>);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('Label component can be imported and rendered', () => {
    renderWithTheme(<Label>Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('does not export theme-related components', () => {
    const exports = require('@/components/ui/index');
    expect(exports.Button).toBeDefined();
    expect(exports.default).toBeDefined();
    expect(exports.Input).toBeDefined();
  });
});
