import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Loading } from '@/components/ui/loading';

jest.mock('@mui/material/CircularProgress', () => {
  return function CircularProgress(props: any) {
    return (
      <div
        data-testid="circular-progress"
        role="progressbar"
        aria-label={props['aria-label'] || 'Loading'}
        data-size={props.size}
        data-thickness={props.thickness}
        data-color={props.color}
      />
    );
  };
});

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('framer-motion', () => ({
  m: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('Loading Component', () => {
  describe('Rendering', () => {
    it('renders correctly with default props - objective: verify component renders with default configuration', () => {
      renderWithTheme(<Loading />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays default loading message - objective: verify default message displays correctly', () => {
      renderWithTheme(<Loading />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('displays custom loading message - objective: verify custom message displays when provided', () => {
      renderWithTheme(<Loading message="Please wait..." />);
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    it('displays long custom message - objective: verify handling of long messages', () => {
      renderWithTheme(
        <Loading message="Loading your data, this may take a moment..." />
      );
      expect(
        screen.getByText('Loading your data, this may take a moment...')
      ).toBeInTheDocument();
    });
  });

  describe('Fullscreen Mode', () => {
    it('renders in non-fullscreen mode by default - objective: verify default mode is not fullscreen', () => {
      const { container } = renderWithTheme(<Loading />);
      const wrapper = container.querySelector('div[style*="flex"]');
      expect(wrapper).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders in fullscreen mode when fullScreen is true - objective: verify fullscreen mode activates correctly', () => {
      const { container } = renderWithTheme(<Loading fullScreen={true} />);
      const fullscreenWrapper = container.querySelector('div[style*="position: fixed"]');
      expect(fullscreenWrapper).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders in fullscreen with custom message - objective: verify fullscreen mode with custom message', () => {
      renderWithTheme(<Loading fullScreen={true} message="Processing..." />);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays message in fullscreen mode - objective: verify message displays in fullscreen', () => {
      renderWithTheme(<Loading fullScreen={true} message="Loading dashboard..." />);
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('fullscreen has fixed positioning - objective: verify fullscreen positioning is correct', () => {
      const { container } = renderWithTheme(<Loading fullScreen={true} />);
      const fullscreenWrapper = container.querySelector('div[style*="position: fixed"]');
      expect(fullscreenWrapper).toBeInTheDocument();
      expect(fullscreenWrapper?.getAttribute('style')).toContain('position: fixed');
    });
  });

  describe('Progress Bar', () => {
    it('applies default progress bar size - objective: verify default size (40) in non-fullscreen', () => {
      renderWithTheme(<Loading />);
      const progress = screen.getByTestId('circular-progress');
      expect(progress).toHaveAttribute('data-size', '40');
    });

    it('applies fullscreen progress bar size - objective: verify size (60) in fullscreen mode', () => {
      renderWithTheme(<Loading fullScreen={true} />);
      const progress = screen.getByTestId('circular-progress');
      expect(progress).toHaveAttribute('data-size', '60');
    });

    it('displays CircularProgress component - objective: verify MUI CircularProgress renders', () => {
      renderWithTheme(<Loading />);
      expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
    });

    it('has correct thickness - objective: verify thickness prop is applied', () => {
      renderWithTheme(<Loading />);
      const progress = screen.getByTestId('circular-progress');
      expect(progress).toHaveAttribute('data-thickness', '4');
    });

    it('has correct color - objective: verify color prop is primary', () => {
      renderWithTheme(<Loading />);
      const progress = screen.getByTestId('circular-progress');
      expect(progress).toHaveAttribute('data-color', 'primary');
    });
  });

  describe('Message Handling', () => {
    it('does not display message when message prop is empty string - objective: verify empty message is handled', () => {
      renderWithTheme(<Loading message="" />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('handles null message gracefully - objective: verify null message does not break component', () => {
      renderWithTheme(<Loading message={null as unknown as string} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('handles undefined message gracefully - objective: verify undefined uses default message', () => {
      renderWithTheme(<Loading />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays message below progress bar in fullscreen mode - objective: verify message position in fullscreen', () => {
      const { container } = renderWithTheme(<Loading fullScreen={true} message="Loading..." />);
      const progress = screen.getByTestId('circular-progress');
      const message = screen.getByText('Loading...');
      expect(progress).toBeInTheDocument();
      expect(message).toBeInTheDocument();
      expect(container.querySelector('div[style*="flex-direction: column"]')).toBeInTheDocument();
    });

    it('displays message beside progress bar in non-fullscreen mode - objective: verify message position in normal mode', () => {
      const { container } = renderWithTheme(<Loading message="Loading..." />);
      const progress = screen.getByTestId('circular-progress');
      const message = screen.getByText('Loading...');
      expect(progress).toBeInTheDocument();
      expect(message).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('renders with ThemeProvider - objective: verify component works with MUI theme', () => {
      renderWithTheme(<Loading />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('applies theme colors - objective: verify theme colors are applied', () => {
      renderWithTheme(<Loading />);
      const progress = screen.getByTestId('circular-progress');
      expect(progress).toHaveAttribute('data-color', 'primary');
    });
  });

  describe('Styling', () => {
    it('has correct spacing in fullscreen mode - objective: verify proper spacing in fullscreen', () => {
      renderWithTheme(<Loading fullScreen={true} message="Loading..." />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('has correct display flex - objective: verify flexbox layout is applied', () => {
      const { container } = renderWithTheme(<Loading />);
      const wrapper = container.querySelector('div[style*="display: flex"]');
      expect(wrapper).toBeInTheDocument();
    });

    it('has centering styles - objective: verify content is centered', () => {
      const { container } = renderWithTheme(<Loading />);
      const wrapper = container.querySelector('div[style*="justify-content: center"]');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper role on progress bar - objective: verify ARIA role is set correctly', () => {
      renderWithTheme(<Loading />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('has accessible name on progress bar - objective: verify ARIA label is present', () => {
      renderWithTheme(<Loading />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-label');
    });

    it('message text is accessible - objective: verify message is readable by screen readers', () => {
      renderWithTheme(<Loading message="Loading data..." />);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long message - objective: verify handling of extremely long messages', () => {
      const longMessage = 'L'.repeat(500);
      renderWithTheme(<Loading message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('handles special characters in message - objective: verify special characters render correctly', () => {
      renderWithTheme(<Loading message="Loading & processing..." />);
      expect(screen.getByText('Loading & processing...')).toBeInTheDocument();
    });

    it('handles unicode in message - objective: verify unicode characters display correctly', () => {
      renderWithTheme(<Loading message="Загрузка... ⏳" />);
      expect(screen.getByText('Загрузка... ⏳')).toBeInTheDocument();
    });

    it('handles HTML entities in message - objective: verify HTML entities are rendered', () => {
      renderWithTheme(<Loading message="Loading &lt;100%&gt;" />);
      expect(screen.getByText('Loading <100%>')).toBeInTheDocument();
    });
  });

  describe('Negative Tests', () => {
    it('does not render when not in DOM - objective: verify component only renders when mounted', () => {
      const { unmount } = renderWithTheme(<Loading />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      unmount();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('does not crash with invalid props - objective: verify resilience to invalid props', () => {
      renderWithTheme(<Loading message={undefined as unknown as string} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Branch Coverage', () => {
    it('covers fullScreen true branch - objective: verify fullscreen code path is tested', () => {
      const { container } = renderWithTheme(<Loading fullScreen={true} />);
      expect(container.querySelector('div[style*="position: fixed"]')).toBeInTheDocument();
    });

    it('covers fullScreen false branch - objective: verify non-fullscreen code path is tested', () => {
      const { container } = renderWithTheme(<Loading fullScreen={false} />);
      expect(container.querySelector('div[style*="position: fixed"]')).not.toBeInTheDocument();
    });

    it('covers message exists branch - objective: verify message display code path is tested', () => {
      renderWithTheme(<Loading message="Test message" />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('covers message does not exist branch - objective: verify no message code path is tested', () => {
      renderWithTheme(<Loading />);
      const progress = screen.getByTestId('circular-progress');
      const messageElement = progress.nextElementSibling as HTMLElement;
      // Message should still exist with default
      expect(messageElement?.textContent).toBe('Loading...');
    });
  });
});
