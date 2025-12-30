import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { FormTooltip } from '@/components/ui/FormTooltip';

// Mock the tooltip config
jest.mock('@/config/tooltip-config', () => ({
  getTooltipContent: jest.fn(),
}));

describe('FormTooltip', () => {
  const mockContent = {
    title: 'Test Tooltip',
    description: 'This is a test tooltip description',
    recommendedValue: '42',
    warning: 'Be careful with this setting',
    examples: ['Example 1', 'Example 2'],
  };

  it('renders children correctly', () => {
    render(
      <FormTooltip content={mockContent}>
        <button>Test Button</button>
      </FormTooltip>
    );

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('renders with basic content structure', () => {
    render(
      <FormTooltip content={mockContent}>
        <button>Test Button</button>
      </FormTooltip>
    );

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('handles small size', () => {
    render(
      <FormTooltip content={mockContent} size="small">
        <button>Test Button</button>
      </FormTooltip>
    );

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('handles medium size', () => {
    render(
      <FormTooltip content={mockContent} size="medium">
        <button>Test Button</button>
      </FormTooltip>
    );

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('handles different placements', () => {
    render(
      <FormTooltip content={mockContent} placement="top">
        <button>Test Button</button>
      </FormTooltip>
    );

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('handles custom enter delay', () => {
    render(
      <FormTooltip content={mockContent} enterDelay={1000}>
        <button>Test Button</button>
      </FormTooltip>
    );

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('handles content without recommended value', () => {
    const contentWithoutRecommended = {
      title: 'Simple Tooltip',
      description: 'Just a description',
    };

    render(
      <FormTooltip content={contentWithoutRecommended}>
        <button>Test Button</button>
      </FormTooltip>
    );

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('handles content without warning', () => {
    const contentWithoutWarning = {
      title: 'Tooltip',
      description: 'Description',
      recommendedValue: '123',
    };

    render(
      <FormTooltip content={contentWithoutWarning}>
        <button>Test Button</button>
      </FormTooltip>
    );

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('handles content without examples', () => {
    const contentWithoutExamples = {
      title: 'Tooltip',
      description: 'Description',
      warning: 'Warning message',
    };

    render(
      <FormTooltip content={contentWithoutExamples}>
        <button>Test Button</button>
      </FormTooltip>
    );

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('renders with default placement', () => {
    render(
      <FormTooltip content={mockContent}>
        <span>Test Element</span>
      </FormTooltip>
    );

    expect(screen.getByText('Test Element')).toBeInTheDocument();
  });

  it('handles different enter delays', () => {
    render(
      <FormTooltip content={mockContent} enterDelay={200} enterNextDelay={300}>
        <button>Test Button</button>
      </FormTooltip>
    );

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('handles different leave delays', () => {
    render(
      <FormTooltip content={mockContent} leaveDelay={100}>
        <button>Test Button</button>
      </FormTooltip>
    );

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('renders with minimal content', () => {
    const minimalContent = {
      title: 'Title',
      description: 'Description',
    };

    render(
      <FormTooltip content={minimalContent}>
        <div>Test</div>
      </FormTooltip>
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles empty examples array', () => {
    const contentWithEmptyExamples = {
      title: 'Tooltip',
      description: 'Description',
      examples: [],
    };

    render(
      <FormTooltip content={contentWithEmptyExamples}>
        <button>Test Button</button>
      </FormTooltip>
    );

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('handles single example', () => {
    const contentWithSingleExample = {
      title: 'Tooltip',
      description: 'Description',
      examples: ['Single example'],
    };

    render(
      <FormTooltip content={contentWithSingleExample}>
        <button>Test Button</button>
      </FormTooltip>
    );

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });
});