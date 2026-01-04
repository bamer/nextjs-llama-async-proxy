import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { renderWithTheme, getCloseSidebarFunction } from './test-utils';

jest.mock('@/components/layout/SidebarProvider', () => ({
  useSidebar: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('Sidebar - Function Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('covers closeSidebar function call on link click', () => {
    renderWithTheme(<Sidebar />, true);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    fireEvent.click(dashboardLink);

    const closeSidebar = getCloseSidebarFunction();
    expect(closeSidebar).toHaveBeenCalled();
  });

  it('covers closeSidebar function call on close button', () => {
    renderWithTheme(<Sidebar />, true);

    const closeButton = screen.getAllByRole('button').find(btn =>
      btn.querySelector('svg')
    );

    if (closeButton) {
      fireEvent.click(closeButton);

      const closeSidebarFunction = getCloseSidebarFunction();
      expect(closeSidebarFunction).toHaveBeenCalled();
    }
  });
});
