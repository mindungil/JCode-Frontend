import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the JCode login action', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /jedutools login/i })).toBeInTheDocument();
});
