import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { api } from '../../utils/api';

// Mock the API module
vi.mock('../../utils/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    refreshCSRFToken: vi.fn(),
    clearCSRFToken: vi.fn(),
  },
}));

// Mock the logger module
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// Test component to access auth context
function TestComponent() {
  const { user, isAuthenticated, isLoading, login, logout, register } = useAuth();

  return (
    <div>
      <p data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</p>
      <p data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</p>
      <p data-testid="user">{user ? JSON.stringify(user) : 'no-user'}</p>
      <button
        data-testid="login-btn"
        onClick={() => login({ email: 'test@example.com', password: 'password' })}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={() => logout()}>
        Logout
      </button>
      <button
        data-testid="register-btn"
        onClick={() =>
          register({
            email: 'test@example.com',
            password: 'password',
            firstName: 'John',
            lastName: 'Doe',
          })
        }
      >
        Register
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('useAuth hook', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('AuthProvider', () => {
    it('renders children correctly', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        success: false,
        data: null,
      });

      render(
        <AuthProvider>
          <div data-testid="child">Child Component</div>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeInTheDocument();
      });
    });

    it('initializes with not authenticated state', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        success: false,
        data: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });
    });

    it('loads cached user from localStorage on mount', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));

      vi.mocked(api.get).mockResolvedValueOnce({
        success: true,
        data: { user: mockUser },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially should load from localStorage
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });
    });

    it('clears user if server returns unauthorized', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));

      vi.mocked(api.get).mockResolvedValueOnce({
        success: false,
        data: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(localStorage.getItem('user')).toBeNull();
      });
    });
  });

  describe('login', () => {
    it('logs in user successfully', async () => {
      const user = userEvent.setup();

      vi.mocked(api.get).mockResolvedValueOnce({ success: false, data: null });
      vi.mocked(api.post).mockResolvedValueOnce({
        success: true,
        message: 'Login successful',
        data: { user: mockUser },
      });
      vi.mocked(api.refreshCSRFToken).mockResolvedValueOnce(undefined);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await user.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
        expect(api.post).toHaveBeenCalledWith('/auth/login', {
          email: 'test@example.com',
          password: 'password',
        });
        expect(api.refreshCSRFToken).toHaveBeenCalled();
      });
    });

    it('handles login failure', async () => {
      const user = userEvent.setup();

      vi.mocked(api.get).mockResolvedValueOnce({ success: false, data: null });
      vi.mocked(api.post).mockResolvedValueOnce({
        success: false,
        message: 'Invalid credentials',
        data: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await user.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      });
    });

    it('handles login API error', async () => {
      const user = userEvent.setup();

      vi.mocked(api.get).mockResolvedValueOnce({ success: false, data: null });
      vi.mocked(api.post).mockRejectedValueOnce({
        response: { data: { message: 'Network error' } },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await user.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      });
    });
  });

  describe('register', () => {
    it('registers user successfully', async () => {
      const user = userEvent.setup();

      vi.mocked(api.get).mockResolvedValueOnce({ success: false, data: null });
      vi.mocked(api.post).mockResolvedValueOnce({
        success: true,
        message: 'Registration successful',
        data: { user: mockUser },
      });
      vi.mocked(api.refreshCSRFToken).mockResolvedValueOnce(undefined);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await user.click(screen.getByTestId('register-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
        expect(api.post).toHaveBeenCalledWith('/auth/register', {
          email: 'test@example.com',
          password: 'password',
          firstName: 'John',
          lastName: 'Doe',
        });
        expect(api.refreshCSRFToken).toHaveBeenCalled();
      });
    });

    it('handles registration failure', async () => {
      const user = userEvent.setup();

      vi.mocked(api.get).mockResolvedValueOnce({ success: false, data: null });
      vi.mocked(api.post).mockResolvedValueOnce({
        success: false,
        message: 'Email already exists',
        data: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await user.click(screen.getByTestId('register-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      });
    });
  });

  describe('logout', () => {
    it('logs out user successfully', async () => {
      const user = userEvent.setup();

      // Setup authenticated state
      localStorage.setItem('user', JSON.stringify(mockUser));
      vi.mocked(api.get).mockResolvedValueOnce({
        success: true,
        data: { user: mockUser },
      });
      vi.mocked(api.post).mockResolvedValueOnce({ success: true });
      vi.mocked(api.clearCSRFToken).mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      await user.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(api.post).toHaveBeenCalledWith('/auth/logout');
        expect(api.clearCSRFToken).toHaveBeenCalled();
        expect(localStorage.getItem('user')).toBeNull();
      });
    });

    it('clears local state even if logout API fails', async () => {
      const user = userEvent.setup();

      localStorage.setItem('user', JSON.stringify(mockUser));
      vi.mocked(api.get).mockResolvedValueOnce({
        success: true,
        data: { user: mockUser },
      });
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Network error'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      await user.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(localStorage.getItem('user')).toBeNull();
      });
    });
  });

  describe('auth check on mount', () => {
    it('handles auth check API error gracefully', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      });
    });
  });
});
