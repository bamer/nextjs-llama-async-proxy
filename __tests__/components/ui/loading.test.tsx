import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Loading } from '@/components/ui/loading';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('framer-motion', () => ({
  m: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('Loading Component', () => {
  describe('Basic Rendering', () => {
    it('renders correctly with default props - objective: verify component renders with default configuration', () => {
      renderWithTheme(<Loading />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
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
    it('renders in fullscreen mode when fullScreen is true - objective: verify fullscreen mode activates correctly', () => {
      renderWithTheme(<Loading fullScreen={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders in fullscreen with custom message - objective: verify fullscreen mode with custom message', () => {
      renderWithTheme(<Loading fullScreen={true} message="Processing..." />);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('displays message in fullscreen mode - objective: verify message displays in fullscreen', () => {
      renderWithTheme(<Loading fullScreen={true} message="Loading dashboard..." />);
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });
  });

  describe('Message Handling', () => {
    it('does not display message when message prop is empty string - objective: verify empty message is handled', () => {
      renderWithTheme(<Loading message="" />);
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('handles null message gracefully - objective: verify null message does not break component', () => {
      renderWithTheme(<Loading message={null as unknown as string} />);
      // Component should render without errors
      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('handles undefined message gracefully - objective: verify undefined uses default message', () => {
      renderWithTheme(<Loading />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('handles special characters in message - objective: verify special characters render correctly', () => {
      renderWithTheme(<Loading message="Loading & processing..." />);
      expect(screen.getByText('Loading & processing...')).toBeInTheDocument();
    });

    it('handles unicode in message - objective: verify unicode characters display correctly', () => {
      renderWithTheme(<Loading message="Загрузка... ⏳" />);
      expect(screen.getByText('Загрузка... ⏳')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long message - objective: verify handling of extremely long messages', () => {
      const longMessage = 'L'.repeat(500);
      renderWithTheme(<Loading message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('does not crash with invalid props - objective: verify resilience to invalid props', () => {
      renderWithTheme(<Loading message={undefined as unknown as string} />);
      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('renders without errors in fullscreen mode - objective: verify fullscreen mode renders correctly', () => {
      expect(() => renderWithTheme(<Loading fullScreen={true} />)).not.toThrow();
    });

    it('renders without errors in non-fullscreen mode - objective: verify normal mode renders correctly', () => {
      expect(() => renderWithTheme(<Loading fullScreen={false} />)).not.toThrow();
    });
  });

  describe('Branch Coverage', () => {
    it('covers fullScreen true branch - objective: verify fullscreen code path is tested', () => {
      renderWithTheme(<Loading fullScreen={true} message="Test" />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('covers fullScreen false branch - objective: verify non-fullscreen code path is tested', () => {
      renderWithTheme(<Loading fullScreen={false} message="Test" />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('covers message exists branch - objective: verify message display code path is tested', () => {
      renderWithTheme(<Loading message="Test message" />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('covers message does not exist branch - objective: verify no message code path is tested', () => {
      renderWithTheme(<Loading message="" />);
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    it('covers default message branch - objective: verify default message code path is tested', () => {
      renderWithTheme(<Loading />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('renders with ThemeProvider - objective: verify component works with MUI theme', () => {
      renderWithTheme(<Loading />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('handles prop changes correctly - objective: verify component updates with new props', () => {
      const { rerender } = renderWithTheme(<Loading message="Initial" />);
      expect(screen.getByText('Initial')).toBeInTheDocument();
      
      rerender(<Loading message="Updated" />);
      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.queryByText('Initial')).not.toBeInTheDocument();
    });
  });
});
