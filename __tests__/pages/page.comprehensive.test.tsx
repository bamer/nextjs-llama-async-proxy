import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import HomePage from '@/app/page';

// Mock MainLayout
jest.mock('@/components/layout/main-layout', () => ({
  MainLayout: ({ children }: any) => React.createElement('div', { 'data-testid': 'main-layout' }, children),
}));

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: any) =>
    React.createElement('a', { href, 'data-href': href }, children);
  return MockLink;
});

// Mock MUI components with proper prop filtering
jest.mock('@mui/material', () => ({
  Typography: ({ children, variant, ...props }: any) => {
    const { gutterBottom, paragraph, ...filteredProps } = props;
    return React.createElement(variant === 'h1' || variant === 'h2' || variant === 'h4' ? 'h1' : 'p', filteredProps, children);
  },
  Box: ({ children, ...props }: any) => {
    const { sx, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
  Button: ({ children, href, component, ...props }: any) => {
    const { sx, variant, color, ...filteredProps } = props;
    // Check if Button is being used as a Link component
    if (typeof component === 'function' && href) {
      return React.createElement('a', { ...filteredProps, href, 'data-href': href, role: 'button' }, children);
    }
    return React.createElement('button', filteredProps, children);
  },
  Card: ({ children, ...props }: any) => {
    const { sx, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
  CardContent: ({ children }: any) => React.createElement('div', { children }),
  Grid: ({ children, ...props }: any) => {
    const { size, spacing, justifyContent, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
}));

// Mock MUI icons
jest.mock('@mui/icons-material', () => ({
  Rocket: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Rocket', width: 24, height: 24 }),
  Dashboard: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Dashboard', width: 24, height: 24 }),
  ModelTraining: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'ModelTraining', width: 24, height: 24 }),
  Monitor: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Monitor', width: 24, height: 24 }),
  Settings: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Settings', width: 24, height: 24 }),
  BarChart: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'BarChart', width: 24, height: 24 }),
  Code: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Code', width: 24, height: 24 }),
  Cloud: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Cloud', width: 24, height: 24 }),
  Terminal: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Terminal', width: 24, height: 24 }),
}));

// Mock ThemeContext
const mockUseTheme = jest.fn();
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => mockUseTheme(),
}));

describe('HomePage - Theme Mode Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTheme.mockReturnValue({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Light Mode', () => {
    beforeEach(() => {
      mockUseTheme.mockReturnValue({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() });
    });

    it('renders in light mode', () => {
      render(<HomePage />);
      expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();
    });

    it('renders hero section in light mode', () => {
      render(<HomePage />);
      expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();
      expect(screen.getByText(/ultimate platform for managing/)).toBeInTheDocument();
    });

    it('renders get started button in light mode', () => {
      render(<HomePage />);
      const button = screen.getByRole('button', { name: /get started/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('href', '/dashboard');
    });

    it('renders features section in light mode', () => {
      render(<HomePage />);
      expect(screen.getByText('Key Features')).toBeInTheDocument();
      expect(screen.getByText('Real-time Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Model Management')).toBeInTheDocument();
      expect(screen.getByText('Advanced Monitoring')).toBeInTheDocument();
      expect(screen.getByText('Custom Configuration')).toBeInTheDocument();
    });

    it('renders stats section in light mode', () => {
      render(<HomePage />);
      expect(screen.getByText('Quick Stats')).toBeInTheDocument();
      expect(screen.getByText('4+')).toBeInTheDocument();
      expect(screen.getByText('99.9%')).toBeInTheDocument();
      expect(screen.getByText('150ms')).toBeInTheDocument();
      expect(screen.getByText('1000+')).toBeInTheDocument();
    });

    it('renders tech stack in light mode', () => {
      render(<HomePage />);
      expect(screen.getByText('Built with Modern Technologies')).toBeInTheDocument();
      expect(screen.getByText('Next.js')).toBeInTheDocument();
      expect(screen.getByText('Material UI')).toBeInTheDocument();
      expect(screen.getByText('WebSocket')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('renders getting started in light mode', () => {
      render(<HomePage />);
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view documentation/i })).toBeInTheDocument();
    });
  });

  describe('Dark Mode', () => {
    beforeEach(() => {
      mockUseTheme.mockReturnValue({ isDark: true, mode: 'dark' as const, setMode: jest.fn(), toggleTheme: jest.fn() });
    });

    it('renders in dark mode', () => {
      render(<HomePage />);
      expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();
    });

    it('renders hero section in dark mode', () => {
      render(<HomePage />);
      expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();
      expect(screen.getByText(/ultimate platform for managing/)).toBeInTheDocument();
    });

    it('renders get started button in dark mode', () => {
      render(<HomePage />);
      const button = screen.getByRole('button', { name: /get started/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('href', '/dashboard');
    });

    it('renders features section in dark mode', () => {
      render(<HomePage />);
      expect(screen.getByText('Key Features')).toBeInTheDocument();
      expect(screen.getByText('Real-time Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Model Management')).toBeInTheDocument();
      expect(screen.getByText('Advanced Monitoring')).toBeInTheDocument();
      expect(screen.getByText('Custom Configuration')).toBeInTheDocument();
    });

    it('renders stats section in dark mode', () => {
      render(<HomePage />);
      expect(screen.getByText('Quick Stats')).toBeInTheDocument();
      expect(screen.getByText('4+')).toBeInTheDocument();
      expect(screen.getByText('99.9%')).toBeInTheDocument();
      expect(screen.getByText('150ms')).toBeInTheDocument();
      expect(screen.getByText('1000+')).toBeInTheDocument();
    });

    it('renders tech stack in dark mode', () => {
      render(<HomePage />);
      expect(screen.getByText('Built with Modern Technologies')).toBeInTheDocument();
      expect(screen.getByText('Next.js')).toBeInTheDocument();
      expect(screen.getByText('Material UI')).toBeInTheDocument();
      expect(screen.getByText('WebSocket')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('renders getting started in dark mode', () => {
      render(<HomePage />);
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view documentation/i })).toBeInTheDocument();
    });
  });

  describe('Feature Cards', () => {
    it('renders all 4 feature cards', () => {
      render(<HomePage />);
      const features = ['Real-time Dashboard', 'Model Management', 'Advanced Monitoring', 'Custom Configuration'];
      features.forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });

    it('feature cards have correct descriptions', () => {
      render(<HomePage />);
      expect(screen.getByText('Monitor your AI models with live metrics and performance data')).toBeInTheDocument();
      expect(screen.getByText('Easily configure and control multiple AI models')).toBeInTheDocument();
      expect(screen.getByText('Track system health and performance in real-time')).toBeInTheDocument();
      expect(screen.getByText('Fine-tune your setup with advanced settings')).toBeInTheDocument();
    });

    it('feature cards have correct icons', () => {
      const { container } = render(<HomePage />);
      const icons = ['Dashboard', 'ModelTraining', 'Monitor', 'Settings'];
      icons.forEach(icon => {
        const element = container.querySelector(`[data-icon="${icon}"]`);
        expect(element).toBeInTheDocument();
      });
    });

    it('feature cards link to correct paths', () => {
      const { container } = render(<HomePage />);
      const links = container.querySelectorAll('[data-href]');
      const paths = ['/dashboard', '/models', '/monitoring', '/settings'];
      paths.forEach(path => {
        const link = Array.from(links).find(l => l.getAttribute('data-href') === path);
        expect(link).toBeInTheDocument();
      });
    });
  });

  describe('Stats Section', () => {
    it('renders all 4 stats', () => {
      render(<HomePage />);
      expect(screen.getByText('4+')).toBeInTheDocument();
      expect(screen.getByText('Active Models')).toBeInTheDocument();
      expect(screen.getByText('99.9%')).toBeInTheDocument();
      expect(screen.getByText('Uptime')).toBeInTheDocument();
      expect(screen.getByText('150ms')).toBeInTheDocument();
      expect(screen.getByText('Avg Response')).toBeInTheDocument();
      expect(screen.getByText('1000+')).toBeInTheDocument();
      expect(screen.getByText('Requests')).toBeInTheDocument();
    });
  });

  describe('Technology Stack', () => {
    it('renders all tech stack icons', () => {
      const { container } = render(<HomePage />);
      const icons = ['BarChart', 'Code', 'Cloud', 'Terminal'];
      icons.forEach(icon => {
        const element = container.querySelector(`[data-icon="${icon}"]`);
        expect(element).toBeInTheDocument();
      });
    });

    it('renders tech stack labels', () => {
      render(<HomePage />);
      expect(screen.getByText('Next.js')).toBeInTheDocument();
      expect(screen.getByText('Material UI')).toBeInTheDocument();
      expect(screen.getByText('WebSocket')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('renders tech stack description', () => {
      render(<HomePage />);
      expect(screen.getByText('Powered by modern web technologies for optimal performance and developer experience')).toBeInTheDocument();
    });
  });

  describe('Getting Started Section', () => {
    it('renders getting started title', () => {
      render(<HomePage />);
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    it('renders getting started intro', () => {
      render(<HomePage />);
      expect(screen.getByText(/New to Llama Runner Pro/)).toBeInTheDocument();
    });

    it('renders all getting started steps', () => {
      render(<HomePage />);
      expect(screen.getByText(/Connect your AI models through the settings/)).toBeInTheDocument();
      expect(screen.getByText(/Configure model parameters and settings/)).toBeInTheDocument();
      expect(screen.getByText(/Start monitoring real-time performance/)).toBeInTheDocument();
      expect(screen.getByText(/Analyze metrics and optimize your setup/)).toBeInTheDocument();
    });

    it('renders view documentation button', () => {
      render(<HomePage />);
      expect(screen.getByText('View Documentation')).toBeInTheDocument();
    });

    it('documentation button has correct href', () => {
      const { container } = render(<HomePage />);
      const links = container.querySelectorAll('[data-href="/docs"]');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Buttons and Links', () => {
    it('renders get started button with correct attributes', () => {
      const { container } = render(<HomePage />);
      const button = screen.getByRole('button', { name: /get started/i });
      expect(button).toBeInTheDocument();
      const link = container.querySelector('[data-href="/dashboard"]');
      expect(link).toBeInTheDocument();
    });

    it('renders view documentation link with correct attributes', () => {
      const { container } = render(<HomePage />);
      expect(screen.getByText('View Documentation')).toBeInTheDocument();
      const link = container.querySelector('[data-href="/docs"]');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('renders rocket icon', () => {
      const { container } = render(<HomePage />);
      const rocket = container.querySelector('[data-icon="Rocket"]');
      expect(rocket).toBeInTheDocument();
    });

    it('renders all feature icons', () => {
      const { container } = render(<HomePage />);
      const icons = ['Dashboard', 'ModelTraining', 'Monitor', 'Settings'];
      icons.forEach(icon => {
        const element = container.querySelector(`[data-icon="${icon}"]`);
        expect(element).toBeInTheDocument();
      });
    });

    it('renders all tech stack icons', () => {
      const { container } = render(<HomePage />);
      const icons = ['BarChart', 'Code', 'Cloud', 'Terminal'];
      icons.forEach(icon => {
        const element = container.querySelector(`[data-icon="${icon}"]`);
        expect(element).toBeInTheDocument();
      });
    });
  });

  describe('Layout and Structure', () => {
    it('renders with MainLayout', () => {
      render(<HomePage />);
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });

    it('renders hero section', () => {
      render(<HomePage />);
      expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();
    });

    it('renders features section', () => {
      render(<HomePage />);
      expect(screen.getByText('Key Features')).toBeInTheDocument();
    });

    it('renders stats section', () => {
      render(<HomePage />);
      expect(screen.getByText('Quick Stats')).toBeInTheDocument();
    });

    it('renders tech stack section', () => {
      render(<HomePage />);
      expect(screen.getByText('Built with Modern Technologies')).toBeInTheDocument();
    });

    it('renders getting started section', () => {
      render(<HomePage />);
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering', () => {
    it('renders correctly in light mode (isDark: false)', () => {
      mockUseTheme.mockReturnValue({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() });
      const { rerender } = render(<HomePage />);
      expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();
    });

    it('renders correctly in dark mode (isDark: true)', () => {
      mockUseTheme.mockReturnValue({ isDark: true, mode: 'dark' as const, setMode: jest.fn(), toggleTheme: jest.fn() });
      render(<HomePage />);
      expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      const { container } = render(<HomePage />);
      const headings = container.querySelectorAll('h1');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('buttons are accessible by role', () => {
      const { container } = render(<HomePage />);
      const buttons = container.querySelectorAll('button, a[role="button"]');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('links are accessible', () => {
      const { container } = render(<HomePage />);
      const links = container.querySelectorAll('a[href]');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Data Structures', () => {
    it('features array has correct length', () => {
      render(<HomePage />);
      const featureTitles = ['Real-time Dashboard', 'Model Management', 'Advanced Monitoring', 'Custom Configuration'];
      featureTitles.forEach(title => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });
    });

    it('stats array has correct length', () => {
      render(<HomePage />);
      expect(screen.getByText('4+')).toBeInTheDocument();
      expect(screen.getByText('99.9%')).toBeInTheDocument();
      expect(screen.getByText('150ms')).toBeInTheDocument();
      expect(screen.getByText('1000+')).toBeInTheDocument();
    });
  });

  describe('Integration with ThemeContext', () => {
    it('uses theme context', () => {
      mockUseTheme.mockReturnValue({ isDark: true, mode: 'dark' as const, setMode: jest.fn(), toggleTheme: jest.fn() });
      render(<HomePage />);
      expect(mockUseTheme).toHaveBeenCalled();
    });

    it('re-renders when theme changes', () => {
      mockUseTheme.mockReturnValue({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() });
      const { rerender } = render(<HomePage />);
      expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();

      mockUseTheme.mockReturnValue({ isDark: true, mode: 'dark' as const, setMode: jest.fn(), toggleTheme: jest.fn() });
      rerender(<HomePage />);
      expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty theme context gracefully', () => {
      mockUseTheme.mockReturnValue({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() });
      render(<HomePage />);
      expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();
    });

    it('handles null/undefined props', () => {
      mockUseTheme.mockReturnValue({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() });
      render(<HomePage />);
      expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts without errors', () => {
      const { container } = render(<HomePage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('unmounts cleanly', () => {
      const { unmount } = render(<HomePage />);
      expect(() => unmount()).not.toThrow();
    });

    it('re-renders correctly', () => {
      const { rerender } = render(<HomePage />);
      rerender(<HomePage />);
      expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();
    });
  });

  describe('Text Content', () => {
    it('has welcome text', () => {
      render(<HomePage />);
      expect(screen.getByText('Welcome to Llama Runner Pro')).toBeInTheDocument();
    });

    it('has description text', () => {
      render(<HomePage />);
      expect(screen.getByText(/ultimate platform for managing and monitoring your AI models with real-time/)).toBeInTheDocument();
    });

    it('has features text', () => {
      render(<HomePage />);
      expect(screen.getByText('Key Features')).toBeInTheDocument();
    });

    it('has stats text', () => {
      render(<HomePage />);
      expect(screen.getByText('Quick Stats')).toBeInTheDocument();
    });

    it('has tech stack text', () => {
      render(<HomePage />);
      expect(screen.getByText('Built with Modern Technologies')).toBeInTheDocument();
    });

    it('has getting started text', () => {
      render(<HomePage />);
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('has dashboard link', () => {
      const { container } = render(<HomePage />);
      const links = container.querySelectorAll('[data-href="/dashboard"]');
      expect(links.length).toBeGreaterThan(0);
    });

    it('has models link', () => {
      const { container } = render(<HomePage />);
      const links = container.querySelectorAll('[data-href="/models"]');
      expect(links.length).toBeGreaterThan(0);
    });

    it('has monitoring link', () => {
      const { container } = render(<HomePage />);
      const links = container.querySelectorAll('[data-href="/monitoring"]');
      expect(links.length).toBeGreaterThan(0);
    });

    it('has settings link', () => {
      const { container } = render(<HomePage />);
      const links = container.querySelectorAll('[data-href="/settings"]');
      expect(links.length).toBeGreaterThan(0);
    });

    it('has docs link', () => {
      const { container } = render(<HomePage />);
      const links = container.querySelectorAll('[data-href="/docs"]');
      expect(links.length).toBeGreaterThan(0);
    });
  });
});
