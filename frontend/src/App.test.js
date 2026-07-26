import { render, screen } from '@testing-library/react';
import App from './App';

test('renders AI Code Review Assistant', () => {
  render(<App />);
  const heading = screen.getByText(/AI Code Review Assistant/i);
  expect(heading).toBeInTheDocument();
});
