import { render, screen } from '@testing-library/react';
import DashboardPage from '../src/components/pages/DashboardPage';

describe('DashboardPage', () => {
  it('renders dashboard metrics', () => {
    render(<DashboardPage />);

    // Check if key elements are rendered
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  it('displays real-time charts', () => {
    render(<DashboardPage />);

    // Check for chart containers
    const charts = screen.getAllByRole('img', { hidden: true }); // Canvas elements
    expect(charts.length).toBeGreaterThan(0);
  });
});