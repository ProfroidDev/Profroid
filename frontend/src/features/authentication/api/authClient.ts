import axios from 'axios';
import type { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    image?: string;
    emailVerified: boolean;
    role?: string;
    isActive?: boolean;
  };
  requiresCompletion?: boolean;
  requiresVerification?: boolean;
  userId?: string;
  message?: string;
  error?: string;
}

export interface UserResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
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
    // Try to get error message from response data first
    const responseData = error.response?.data as { error?: string; message?: string } | undefined;
    return responseData?.error || responseData?.message || error.message || 'An error occurred';
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
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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

      // Don't store token yet - user must complete customer registration first
      return response.data;
    } catch (error: unknown) {
      // If it's an axios error with response data, return that data
      if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data as AuthResponse;
        return {
          success: false,
          error: data.error || data.message || getErrorMessage(error),
          requiresVerification: data.requiresVerification,
          userId: data.userId,
          message: data.message,
        };
      }
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * Complete registration after customer data is submitted
   */
  async completeRegistration(userId: string, customerData?: unknown): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>('/complete-registration', {
        userId,
        customerData,
      });

      // Store JWT token now that registration is complete
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
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
   * Sign in user
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>('/sign-in', {
        email,
        password,
      });

      // Store JWT token only if registration is complete
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }

      return response.data;
    } catch (error: unknown) {
      // If it's an axios error with response data, return that data
      if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data as AuthResponse;
        // If the response has success:false but has requiresVerification or requiresCompletion, return it
        if (!data.success && (data.requiresVerification || data.requiresCompletion)) {
          return data;
        }
        return {
          success: false,
          error: data.error || data.message || getErrorMessage(error),
        };
      }
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
      localStorage.removeItem('authToken');
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
   * Get stored auth token
   */
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Clear session
   */
  clearSession(): void {
    localStorage.removeItem('authToken');
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await this.client.post<{ success: boolean; message: string }>('/forgot-password', {
        email,
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
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await this.client.post<{ success: boolean; message: string }>('/reset-password', {
        token,
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
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; userId?: string; message?: string; error?: string }> {
    try {
      const response = await this.client.post<{ success: boolean; userId: string; message: string }>('/verify-email/' + token);
      return response.data;
    } catch (error: unknown) {
      // If it's an axios error with response data, return that data
      if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data as { success: boolean; userId?: string; message?: string; error?: string };
        return {
          success: false,
          error: data.error || data.message || getErrorMessage(error),
          message: data.message,
          userId: data.userId,
        };
      }
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await this.client.post<{ success: boolean; message: string }>('/resend-verification', {
        email,
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
   * Get verification status for authenticated user
   */
  async getVerificationStatus(): Promise<{ 
    success: boolean; 
    verified?: boolean;
    emailVerifiedAt?: string;
    attempts?: number;
    lockedUntil?: string;
    error?: string;
  }> {
    try {
      const response = await this.client.get('/verify-status');
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }
}

export default new AuthAPI();
