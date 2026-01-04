import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import Layout from '@/components/layout/Layout';
import { renderWithTheme } from './Layout.test-utils';

describe('Layout Transitions', () => {
  it('handles sidebar closed state correctly', () => {
    const { useSidebar } = require('@/components/layout/SidebarProvider');
    jest.mocked(useSidebar).mockReturnValue({
      isOpen: false,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: jest.fn(),
    });

    const { container } = renderWithTheme(
      <Layout>
        <div>Test</div>
      </Layout>
    );

    const mainElement = container.querySelector('main');
    expect(mainElement).not.toHaveClass('md:ml-64');
  });

  it('handles sidebar open state correctly', () => {
    const { useSidebar } = require('@/components/layout/SidebarProvider');
    jest.mocked(useSidebar).mockReturnValue({
      isOpen: true,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: jest.fn(),
    });

    const { container } = renderWithTheme(
      <Layout>
        <div>Test</div>
      </Layout>
    );

    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('md:ml-64');
  });

  it('handles rapid state changes', () => {
    const { useSidebar } = require('@/components/layout/SidebarProvider');
    for (let i = 0; i < 20; i++) {
      jest.mocked(useSidebar).mockReturnValue({
        isOpen: i % 2 === 0,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: jest.fn(),
      });

      const { container } = renderWithTheme(
        <Layout>
          <div>Test</div>
        </Layout>
      );

      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    }
  });
});
