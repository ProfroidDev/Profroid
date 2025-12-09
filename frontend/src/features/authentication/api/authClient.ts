import axios from 'axios';
import type { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/auth';

export interface AuthResponse {
  success: boolean;
  session?: {
    id: string;
    userId: string;
    expires: string;
  };
  user?: {
    id: string;
    email: string;
    name: string;
    image?: string;
    emailVerified: boolean;
    role?: string;
    isActive?: boolean;
  };
  error?: string;
}

export interface UserResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    image?: string;
    emailVerified: boolean;
    role: string;
    isActive: boolean;
    phone?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    province?: string;
    country?: string;
    createdAt?: string;
  };
  error?: string;
}

/**
 * Helper function to handle axios errors
 */
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || error.message || 'An error occurred';
  }
  return error instanceof Error ? error.message : 'An error occurred';
}

/**
 * API client for authentication service
 */
class AuthAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      withCredentials: true,
    });

    // Add request interceptor to include session token
    this.client.interceptors.request.use((config) => {
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) {
        config.headers.Authorization = `Bearer ${sessionId}`;
      }
      return config;
    });
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>('/register', {
        email,
        password,
        name: name || '',
      });
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * Sign in user
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>('/sign-in', {
        email,
        password,
      });

      // Store session ID in localStorage
      if (response.data.session?.id) {
        localStorage.setItem('sessionId', response.data.session.id);
      }

      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * Get current user
   */
  async getUser(): Promise<UserResponse> {
    try {
      const response = await this.client.get<UserResponse>('/user');
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * Update user profile
   */
  async updateUser(updates: Record<string, string>): Promise<UserResponse> {
    try {
      const response = await this.client.put<UserResponse>('/user', updates);
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.post<Record<string, unknown>>('/change-password', {
        oldPassword,
        newPassword,
      });
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<boolean> {
    try {
      await this.client.post('/sign-out');
      localStorage.removeItem('sessionId');
      return true;
    } catch (error) {
      console.error('Sign out failed', error);
      return false;
    }
  }

  /**
   * Check if auth service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Get stored session ID
   */
  getSessionId(): string | null {
    return localStorage.getItem('sessionId');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getSessionId();
  }

  /**
   * Clear session
   */
  clearSession(): void {
    localStorage.removeItem('sessionId');
  }
}

export default new AuthAPI();
