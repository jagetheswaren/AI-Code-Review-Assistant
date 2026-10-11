import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the landing page when unauthenticated', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /review code before/i });
  expect(heading).toBeInTheDocument();
});

test('renders the landing page at /landing', () => {
  window.history.pushState({}, '', '/landing');
  render(<App />);
  expect(screen.getByRole('heading', { name: /review code before/i })).toBeInTheDocument();
  window.history.pushState({}, '', '/');
});
