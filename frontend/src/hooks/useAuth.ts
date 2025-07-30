// frontend/src/hooks/useAuth.ts (Enhanced version - compatible with existing structure)
import { useState, useEffect, useCallback, useContext, createContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LoginCredentials, RegisterCredentials, SecurityEvent } from '@/types/auth';
import { trackSecurityEvent } from '@/types/auth';

// Extend your existing User type or use this enhanced version
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
  isEmailVerified: boolean;
  twoFactorEnabled?: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Enhanced API client with better error handling
class AuthApiClient {
  private baseURL: string;
  
  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    // Get auth token
    const token = this.getStoredToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Keep default error message if response isn't JSON
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }

  async login(credentials: LoginCredentials) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(credentials: RegisterCredentials) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken() {
    return this.request('/api/auth/refresh', {
      method: 'POST',
    });
  }

  async getProfile() {
    return this.request('/api/auth/profile');
  }
}

// Token management utility
class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly USER_KEY = 'auth_user';

  static setTokens(accessToken: string, user?: User) {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.TOKEN_KEY, accessToken);
      
      if (user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      }
    } catch (error) {
      console.warn('Failed to store tokens:', error);
    }
  }

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  static getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  static clearTokens() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.warn('Failed to clear tokens:', error);
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}

// Auth Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const router = useRouter();
  const apiClient = new AuthApiClient();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = TokenManager.getAccessToken();
      const storedUser = TokenManager.getStoredUser();

      if (!token || !storedUser) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      if (TokenManager.isTokenExpired(token)) {
        TokenManager.clearTokens();
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      setState(prev => ({
        ...prev,
        user: storedUser,
        isAuthenticated: true,
        isLoading: false,
      }));

      trackSecurityEvent({
        type: 'login_success',
        metadata: { method: 'session_restore' }
      });
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const response = await apiClient.login(credentials) as any;
      const { user, accessToken } = response;

      TokenManager.setTokens(accessToken, user);
      
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        error: null,
      }));

      trackSecurityEvent({
        type: 'login_success',
        metadata: { 
          method: 'password',
          email: credentials.email
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      
      trackSecurityEvent({
        type: 'login_failure',
        metadata: { 
          error: errorMessage,
          email: credentials.email
        }
      });
      
      throw error;
    }
  }, [apiClient]);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const response = await apiClient.register(credentials) as any;
      const { user, accessToken } = response;

      TokenManager.setTokens(accessToken, user);
      
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        error: null,
      }));

      trackSecurityEvent({
        type: 'registration_attempt',
        metadata: { email: credentials.email }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [apiClient]);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      TokenManager.clearTokens();
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      trackSecurityEvent({
        type: 'logout',
        metadata: { method: 'manual' }
      });

      router.push('/auth/login');
    }
  }, [apiClient, router]);

  const refreshAuth = useCallback(async () => {
    try {
      const response = await apiClient.refreshToken() as any;
      const { user, accessToken } = response;

      TokenManager.setTokens(accessToken, user);
      
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        isLoading: false,
      }));

    } catch (error) {
      console.warn('Token refresh failed:', error);
      TokenManager.clearTokens();
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      trackSecurityEvent({
        type: 'session_expired',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }, [apiClient]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    // Implementation for profile updates
    // This should match your existing updateProfile functionality
    try {
      const response = await apiClient.request('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }) as any;

      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...response } : null,
      }));
    } catch (error) {
      throw error;
    }
  }, [apiClient]);

  const contextValue: AuthContextType = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    refreshAuth,
    clearError,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useProtectedRoute(redirectTo: string = '/auth/login') {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      const redirectUrl = currentPath !== '/' ? `?redirect=${encodeURIComponent(currentPath)}` : '';
      router.replace(`${redirectTo}${redirectUrl}`);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return {
    isAuthenticated,
    isLoading,
    user,
    error: !isLoading && !isAuthenticated ? new Error('Authentication required') : null,
  };
}