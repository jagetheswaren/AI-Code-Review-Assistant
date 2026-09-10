import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the login page when unauthenticated', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /welcome back/i });
  expect(heading).toBeInTheDocument();
});
