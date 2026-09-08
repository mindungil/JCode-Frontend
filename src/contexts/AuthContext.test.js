import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import {
  getCurrentToken,
  isValidToken,
  refreshTokenRequest,
  removeToken,
} from '../utils/tokenUtils';

jest.mock('../services/api', () => ({
  authService: { logout: jest.fn() },
}));

jest.mock('../utils/tokenUtils', () => ({
  getCurrentToken: jest.fn(),
  isValidToken: jest.fn(),
  refreshTokenRequest: jest.fn(),
  removeToken: jest.fn(),
}));

const AuthState = () => {
  const { loading, isAuthenticated } = useAuth();
  return <div>{loading ? 'loading' : isAuthenticated ? 'authenticated' : 'anonymous'}</div>;
};

describe('AuthProvider session recovery', () => {
  const originalLocation = window.location;

  beforeAll(() => {
    delete window.location;
    window.location = {
      href: '',
      pathname: '/login',
      replace: jest.fn(),
    };
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    window.location.href = '';
    getCurrentToken.mockReturnValue(null);
    isValidToken.mockReturnValue(false);
  });

  test('stays anonymous without reloading when session refresh fails', async () => {
    refreshTokenRequest.mockRejectedValue(new Error('no refresh session'));

    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument());
    expect(removeToken).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('');
    expect(window.location.replace).not.toHaveBeenCalled();
  });
});
