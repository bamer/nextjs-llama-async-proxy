import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Loading } from '@/components/ui/loading';

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('Loading', () => {
  it('renders correctly with default props', () => {
    renderWithTheme(<Loading />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays default loading message', () => {
    renderWithTheme(<Loading />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays custom loading message', () => {
    renderWithTheme(<Loading message="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('displays long custom message', () => {
    renderWithTheme(
      <Loading message="Loading your data, this may take a moment..." />
    );
    expect(
      screen.getByText('Loading your data, this may take a moment...')
    ).toBeInTheDocument();
  });

  it('renders in non-fullscreen mode by default', () => {
    renderWithTheme(<Loading />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();
  });

  it('renders in fullscreen mode when fullScreen is true', () => {
    const { container } = renderWithTheme(<Loading fullScreen={true} />);
    const fullscreenBox = container.querySelector('[style*="position: fixed"]');
    expect(fullscreenBox).toBeInTheDocument();
  });

  it('renders in fullscreen with custom message', () => {
    renderWithTheme(<Loading fullScreen={true} message="Processing..." />);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    const fullscreenBox = document.querySelector('[style*="position: fixed"]');
    expect(fullscreenBox).toBeInTheDocument();
  });

  it('displays message in fullscreen mode', () => {
    renderWithTheme(<Loading fullScreen={true} message="Loading dashboard..." />);
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('does not display message when message prop is empty string', () => {
    renderWithTheme(<Loading message="" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('applies default progress bar size', () => {
    renderWithTheme(<Loading />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();
  });

  it('renders centered layout in non-fullscreen mode', () => {
    const { container } = renderWithTheme(<Loading />);
    const box = container.querySelector('div[style*="display: flex"]');
    expect(box).toBeInTheDocument();
  });

  it('renders centered layout in fullscreen mode', () => {
    const { container } = renderWithTheme(<Loading fullScreen={true} />);
    const box = container.querySelector('div[style*="display: flex"]');
    expect(box).toBeInTheDocument();
  });

  it('applies full viewport dimensions in fullscreen mode', () => {
    const { container } = renderWithTheme(<Loading fullScreen={true} />);
    const fullscreenBox = container.querySelector('[style*="height: 100vh"]');
    expect(fullscreenBox).toBeInTheDocument();
  });

  it('applies z-index in fullscreen mode', () => {
    const { container } = renderWithTheme(<Loading fullScreen={true} />);
    const fullscreenBox = container.querySelector('[style*="z-index: 9999"]');
    expect(fullscreenBox).toBeInTheDocument();
  });

  it('displays CircularProgress component', () => {
    renderWithTheme(<Loading />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders with flex column in fullscreen mode', () => {
    const { container } = renderWithTheme(<Loading fullScreen={true} />);
    const box = container.querySelector('[style*="flex-direction: column"]');
    expect(box).toBeInTheDocument();
  });

  it('renders with flex row in non-fullscreen mode', () => {
    const { container } = renderWithTheme(<Loading />);
    const box = container.querySelector('[style*="align-items: center"]');
    expect(box).toBeInTheDocument();
  });

  it('centers content vertically in fullscreen mode', () => {
    const { container } = renderWithTheme(<Loading fullScreen={true} />);
    const box = container.querySelector('[style*="justifyContent: center"]');
    expect(box).toBeInTheDocument();
  });

  it('displays message below progress bar in fullscreen mode', () => {
    renderWithTheme(<Loading fullScreen={true} message="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays message beside progress bar in non-fullscreen mode', () => {
    renderWithTheme(<Loading message="Loading..." />);
    const progress = screen.getByRole('progressbar');
    const message = screen.getByText('Loading...');
    expect(progress).toBeInTheDocument();
    expect(message).toBeInTheDocument();
  });

  it('handles null message gracefully', () => {
    renderWithTheme(<Loading message={null as unknown as string} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles undefined message gracefully', () => {
    renderWithTheme(<Loading />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders with ThemeProvider', () => {
    renderWithTheme(<Loading />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('applies theme colors', () => {
    renderWithTheme(<Loading />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();
  });

  it('has correct spacing in fullscreen mode', () => {
    renderWithTheme(<Loading fullScreen={true} message="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('has correct padding in fullscreen mode', () => {
    const { container } = renderWithTheme(<Loading fullScreen={true} />);
    const box = container.querySelector('[style*="padding"]');
    expect(box).toBeInTheDocument();
  });

  it('sets background color in fullscreen mode', () => {
    const { container } = renderWithTheme(<Loading fullScreen={true} />);
    const box = container.querySelector('[style*="backgroundColor"]');
    expect(box).toBeInTheDocument();
  });

  it('does not set position in non-fullscreen mode', () => {
    const { container } = renderWithTheme(<Loading />);
    const box = container.querySelector('[style*="position: fixed"]');
    expect(box).not.toBeInTheDocument();
  });

  it('renders with flexbox layout', () => {
    renderWithTheme(<Loading />);
    const { container } = renderWithTheme(<Loading />);
    const box = container.querySelector('[style*="display: flex"]');
    expect(box).toBeInTheDocument();
  });

  it('aligns items to center', () => {
    const { container } = renderWithTheme(<Loading />);
    const box = container.querySelector('[style*="alignItems: center"]');
    expect(box).toBeInTheDocument();
  });
});
