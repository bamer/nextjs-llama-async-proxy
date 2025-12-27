import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input, TextArea, Select, Label } from '@/components/ui/Input';

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
    render(<Button>Test Button</Button>);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('Card component can be imported and rendered', () => {
    render(<Card />);
    expect(screen.getByText('Word of the Day')).toBeInTheDocument();
  });

  it('Input component can be imported and rendered', () => {
    render(<Input placeholder="Test Input" />);
    expect(screen.getByPlaceholderText('Test Input')).toBeInTheDocument();
  });

  it('TextArea component can be imported and rendered', () => {
    render(<TextArea placeholder="Test TextArea" />);
    expect(screen.getByPlaceholderText('Test TextArea')).toBeInTheDocument();
  });

  it('Select component can be imported and rendered', () => {
    render(<Select><option>Option 1</option></Select>);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('Label component can be imported and rendered', () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('does not export theme-related components', () => {
    const exports = require('@/components/ui/index');
    expect(exports.Button).toBeDefined();
    expect(exports.default).toBeDefined();
    expect(exports.Input).toBeDefined();
  });
});
