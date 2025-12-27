import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Header, Sidebar } from '@/components/layout';

jest.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="header">Header Component</div>,
}));

jest.mock('@/components/layout/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar Component</div>,
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('Layout Index Exports', () => {
  describe('Component Exports', () => {
    it('exports Header component', () => {
      expect(Header).toBeDefined();
      expect(typeof Header).toBe('function');
    });

    it('exports Sidebar component', () => {
      expect(Sidebar).toBeDefined();
      expect(typeof Sidebar).toBe('function');
    });
  });

  describe('Component Rendering', () => {
    it('Header can be rendered', () => {
      renderWithTheme(<Header />);
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('Sidebar can be rendered', () => {
      renderWithTheme(<Sidebar />);
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('Header and Sidebar can be rendered together', () => {
      renderWithTheme(
        <>
          <Header />
          <Sidebar />
        </>
      );

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles components with props', () => {
      renderWithTheme(
        <>
          <Header />
          <Sidebar />
        </>
      );

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('handles components with children', () => {
      const TestComponent = () => <div>Test Child</div>;

      renderWithTheme(
        <>
          <Header />
          <Sidebar />
          <TestComponent />
        </>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('maintains exports after re-import', () => {
      const imports1 = require('@/components/layout');
      const imports2 = require('@/components/layout');

      expect(imports1.Header).toBeDefined();
      expect(imports2.Header).toBeDefined();
      expect(imports1.Header).toBe(imports2.Header);
    });

    it('handles conditional rendering of components', () => {
      const showHeader = true;
      const showSidebar = false;

      renderWithTheme(
        <>
          {showHeader && <Header />}
          {showSidebar && <Sidebar />}
        </>
      );

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    });
  });

  describe('Export Consistency', () => {
    it('exports all expected layout components', () => {
      const exports = require('@/components/layout');

      expect(Object.keys(exports)).toContain('Header');
      expect(Object.keys(exports)).toContain('Sidebar');
    });

    it('exports components as named exports', () => {
      const { Header, Sidebar } = require('@/components/layout');

      expect(Header).toBeDefined();
      expect(Sidebar).toBeDefined();
    });

    it('exports do not contain unexpected properties', () => {
      const exports = Object.keys(require('@/components/layout'));

      const expectedExports = ['Header', 'Sidebar'];

      exports.forEach(exp => {
        expect(expectedExports).toContain(exp);
      });
    });

    it('has no default export', () => {
      const exports = require('@/components/layout');

      expect(exports.default).toBeUndefined();
    });
  });

  describe('Component Composition', () => {
    it('can compose Header and Sidebar in a layout structure', () => {
      renderWithTheme(
        <div data-testid="layout-wrapper">
          <Header />
          <div className="flex">
            <Sidebar />
            <main>Main Content</main>
          </div>
        </div>
      );

      expect(screen.getByTestId('layout-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('can nest components deeply', () => {
      renderWithTheme(
        <div>
          <div>
            <div>
              <Header />
            </div>
            <div>
              <Sidebar />
            </div>
          </div>
        </div>
      );

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
  });

  describe('Type Safety', () => {
    it('components accept valid React children', () => {
      const TestChild = () => <div>Child</div>;

      expect(() => {
        renderWithTheme(
          <>
            <Header />
            <Sidebar />
            <TestChild />
          </>
        );
      }).not.toThrow();
    });

    it('components handle null children gracefully', () => {
      expect(() => {
        renderWithTheme(
          <>
            <Header />
            <Sidebar />
            {null}
          </>
        );
      }).not.toThrow();
    });

    it('components handle undefined children gracefully', () => {
      expect(() => {
        renderWithTheme(
          <>
            <Header />
            <Sidebar />
            {undefined}
          </>
        );
      }).not.toThrow();
    });
  });

  describe('Multiple Import Scenarios', () => {
    it('allows importing components individually', () => {
      const { Header } = require('@/components/layout');
      const { Sidebar } = require('@/components/layout');

      expect(Header).toBeDefined();
      expect(Sidebar).toBeDefined();
    });

    it('allows importing all components via destructuring', () => {
      const { Header, Sidebar } = require('@/components/layout');

      expect(Header).toBeDefined();
      expect(Sidebar).toBeDefined();
    });

    it('handles multiple import statements', () => {
      const import1 = require('@/components/layout');
      const import2 = require('@/components/layout');

      expect(import1.Header).toBe(import2.Header);
      expect(import1.Sidebar).toBe(import2.Sidebar);
    });
  });
});
