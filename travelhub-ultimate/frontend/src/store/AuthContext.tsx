import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';
import { logger } from '../utils/logger';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check if user is authenticated on mount
   * Tries to fetch current user from server using httpOnly cookies
   */
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);

      // Try to get user from localStorage first (fast check)
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }

      // Validate with server using httpOnly cookie
      const response = await api.get<{
        success: boolean;
        data: { user: User };
      }>('/auth/me');

      if (response.success && response.data.user) {
        setUser(response.data.user);
        // Cache user data in localStorage for fast loading
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        // Clear cached user if server says unauthorized
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (error) {
      logger.error('Auth check failed', error);
      // User not authenticated or session expired
      setUser(null);
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login user with email and password
   * Server will set httpOnly cookies for tokens
   */
  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const response = await api.post<{
        success: boolean;
        message: string;
        data: {
          user: User;
          // Tokens are now in httpOnly cookies, NOT in response body
        };
      }>('/auth/login', credentials);

      if (response.success && response.data.user) {
        setUser(response.data.user);
        // Cache user data for fast loading
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Refresh CSRF token after login
        await api.refreshCSRFToken();

        logger.info('Login successful');
        return { success: true };
      } else {
        return {
          success: false,
          error: response.message || 'Login failed',
        };
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      logger.error('Login failed', err);
      return {
        success: false,
        error: apiError.response?.data?.message || 'Invalid email or password',
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register new user
   * Server will set httpOnly cookies for tokens
   */
  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const response = await api.post<{
        success: boolean;
        message: string;
        data: {
          user: User;
          // Tokens are now in httpOnly cookies
        };
      }>('/auth/register', data);

      if (response.success && response.data.user) {
        setUser(response.data.user);
        // Cache user data
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Refresh CSRF token after registration
        await api.refreshCSRFToken();

        logger.info('Registration successful');
        return { success: true };
      } else {
        return {
          success: false,
          error: response.message || 'Registration failed',
        };
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      logger.error('Registration failed', err);
      return {
        success: false,
        error: apiError.response?.data?.message || 'Registration failed',
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user
   * Server will clear httpOnly cookies
   */
  const logout = async () => {
    try {
      // Call logout endpoint to clear server-side session and cookies
      await api.post('/auth/logout');

      // Clear CSRF token
      api.clearCSRFToken();

      logger.info('Logout successful');
    } catch (error) {
      logger.error('Logout request failed', error);
      // Continue with local logout even if server request fails
    } finally {
      // Clear local state
      setUser(null);
      localStorage.removeItem('user');
      // Cookies are cleared by server automatically
    }
  };

  /**
   * Refresh user data from server
   */
  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
