import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import ApiRoutes from '@/components/pages/ApiRoutes';
import { createTheme, ThemeProvider } from '@mui/material/styles';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('framer-motion', () => ({
  m: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('ApiRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    renderWithTheme(<ApiRoutes />);
    expect(screen.getByText(/API Routes/i)).toBeInTheDocument();
  });

  it('displays API endpoints', () => {
    renderWithTheme(<ApiRoutes />);
    expect(screen.getByText(/monitoring/i)).toBeInTheDocument();
  });

  it('shows monitoring endpoint', () => {
    renderWithTheme(<ApiRoutes />);
    expect(screen.getByText(/GET \/api\/monitoring/i)).toBeInTheDocument();
  });

  it('shows monitoring history endpoint', () => {
    renderWithTheme(<ApiRoutes />);
    expect(screen.getByText(/GET \/api\/monitoring\/history/i)).toBeInTheDocument();
  });

  it('displays endpoint descriptions', () => {
    renderWithTheme(<ApiRoutes />);
    expect(screen.getByText(/real-time system metrics/i)).toBeInTheDocument();
  });
});
