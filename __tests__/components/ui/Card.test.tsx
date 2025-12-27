import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Card from '@/components/ui/Card';

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('Card (BasicCard)', () => {
  it('renders correctly with default content', () => {
    renderWithTheme(<Card />);
    expect(screen.getByText('Word of the Day')).toBeInTheDocument();
  });

  it('renders the word "benevolent"', () => {
    const { container } = renderWithTheme(<Card />);
    const titleElement = container.querySelector('.MuiTypography-h5');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent(/be.*nev.*o.*lent/);
  });

  it('renders the part of speech', () => {
    renderWithTheme(<Card />);
    expect(screen.getByText('adjective')).toBeInTheDocument();
  });

  it('renders the definition', () => {
    renderWithTheme(<Card />);
    expect(screen.getByText(/well meaning and kindly/)).toBeInTheDocument();
  });

  it('renders the quote', () => {
    renderWithTheme(<Card />);
    expect(screen.getByText(/"a benevolent smile"/)).toBeInTheDocument();
  });

  it('renders the "Learn More" button', () => {
    renderWithTheme(<Card />);
    const button = screen.getByRole('button', { name: 'Learn More' });
    expect(button).toBeInTheDocument();
  });

  it('renders CardContent', () => {
    const { container } = renderWithTheme(<Card />);
    const cardContent = container.querySelector('.MuiCardContent-root');
    expect(cardContent).toBeInTheDocument();
  });

  it('renders CardActions', () => {
    const { container } = renderWithTheme(<Card />);
    const cardActions = container.querySelector('.MuiCardActions-root');
    expect(cardActions).toBeInTheDocument();
  });

  it('has minimum width styling', () => {
    const { container } = renderWithTheme(<Card />);
    const card = container.querySelector('.MuiCard-root');
    expect(card).toHaveStyle({ minWidth: '275px' });
  });
});
