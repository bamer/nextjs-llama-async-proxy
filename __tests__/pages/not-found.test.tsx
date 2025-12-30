import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
// Use relative import for app directory
import NotFound from '../../app/not-found';

describe('NotFound Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders 404 heading', () => {
    render(<NotFound />);

    const heading = screen.getByText('404');
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H1');
  });

  it('renders page not found message', () => {
    render(<NotFound />);

    const message = screen.getByText('Page not found');
    expect(message).toBeInTheDocument();
  });

  it('has correct container styling', () => {
    const { container } = render(<NotFound />);

    const mainDiv = container.querySelector('.min-h-screen');
    expect(mainDiv).toBeInTheDocument();
    expect(mainDiv).toHaveClass('min-h-screen');
    expect(mainDiv).toHaveClass('flex');
    expect(mainDiv).toHaveClass('items-center');
    expect(mainDiv).toHaveClass('justify-center');
    expect(mainDiv).toHaveClass('bg-background');
  });

  it('has centered text container', () => {
    const { container } = render(<NotFound />);

    const textContainer = container.querySelector('.text-center');
    expect(textContainer).toBeInTheDocument();
    expect(textContainer).toHaveClass('text-center');
  });

  it('has bold heading style', () => {
    const { container } = render(<NotFound />);

    const heading = container.querySelector('.text-4xl.font-bold');
    expect(heading).toBeInTheDocument();
  });

  it('has muted text for description', () => {
    const { container } = render(<NotFound />);

    const description = container.querySelector('.text-muted-foreground');
    expect(description).toBeInTheDocument();
  });

  it('renders without errors', () => {
    const { container } = render(<NotFound />);

    expect(container).toBeInTheDocument();
  });

  it('has accessible heading level', () => {
    render(<NotFound />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('404');
  });

  it('has correct text hierarchy', () => {
    const { container } = render(<NotFound />);

    const heading = container.querySelector('h1');
    const paragraph = container.querySelector('p');

    expect(heading).toBeInTheDocument();
    expect(paragraph).toBeInTheDocument();

    // Verify parent-child relationship
    expect(paragraph?.parentElement).toBe(heading?.parentElement);
  });

  it('handles rapid re-renders', () => {
    const { rerender } = render(<NotFound />);

    expect(screen.getByText('404')).toBeInTheDocument();

    rerender(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();

    rerender(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('snapshot test', () => {
    const { container } = render(<NotFound />);

    expect(container.firstChild).toMatchSnapshot();
  });

  it('has minimal DOM structure', () => {
    const { container } = render(<NotFound />);

    // Should have minimal elements: div -> div -> h1, p
    const divs = container.querySelectorAll('div');
    const headings = container.querySelectorAll('h1');
    const paragraphs = container.querySelectorAll('p');

    expect(divs.length).toBe(2);
    expect(headings.length).toBe(1);
    expect(paragraphs.length).toBe(1);
  });

  it('text content is exact', () => {
    render(<NotFound />);

    const heading = screen.getByText('404');
    const paragraph = screen.getByText('Page not found');

    expect(heading.textContent).toBe('404');
    expect(paragraph.textContent).toBe('Page not found');
  });

  it('has no console errors', () => {
    const consoleError = jest.spyOn(console, 'error');

    render(<NotFound />);

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('has no console warnings', () => {
    const consoleWarn = jest.spyOn(console, 'warn');

    render(<NotFound />);

    expect(consoleWarn).not.toHaveBeenCalled();
    consoleWarn.mockRestore();
  });
});
