import { create } from 'zustand';
import authClient from '../api/authClient';

export interface AuthUser {
  id: string;
  email: string;
  image?: string;
  emailVerified: boolean;
  role: string;
  employeeType?: string;
  isActive: boolean;
}

export interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateProfile: (updates: Record<string, string>) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  clearError: () => void;
  setUser: (user: AuthUser | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
}

/**
 * Zustand store for authentication state management
 */
const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: authClient.getToken(),
  isAuthenticated: authClient.isAuthenticated(),
  isLoading: authClient.isAuthenticated(), // Start loading if token exists
  error: null,

  /**
   * Login user
   */
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authClient.signIn(email, password);
      if (response.success && response.token && response.user) {
        // Store token first
        set({
          token: response.token,
          isAuthenticated: true,
          user: response.user as AuthUser,
        });
        
        // Then fetch full user details to get employeeType and other fields
        try {
          const userResponse = await authClient.getUser();
          if (userResponse.success && userResponse.user) {
            set({
              isLoading: false,
              user: {
                ...response.user,
                role: userResponse.user.role,
                isActive: userResponse.user.isActive,
                // employeeType will be fetched separately if needed
              } as AuthUser,
            });
          } else {
            // Fallback to initial user if fetch fails
            set({ isLoading: false });
          }
        } catch (fetchError) {
          console.error('Failed to fetch full user details:', fetchError);
          set({ isLoading: false });
        }
        return true;
      } else if (response.requiresCompletion) {
        // User needs to complete customer registration
        set({
          isLoading: false,
          error: response.message || 'Please complete your registration',
        });
        return false;
      } else {
        set({
          isLoading: false,
          error: response.error || 'Login failed',
        });
        return false;
      }
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
      return false;
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    set({ isLoading: true });
    try {
      await authClient.signOut();
      set({
        isLoading: false,
        token: null,
        isAuthenticated: false,
        user: null,
        error: null,
      });
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      });
    }
  },

  /**
   * Fetch current user details
   */
  fetchUser: async () => {
    if (!authClient.isAuthenticated()) {
      set({ user: null, isAuthenticated: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await authClient.getUser();
      if (response.success && response.user) {
        set({
          isLoading: false,
          user: response.user as AuthUser,
          isAuthenticated: true,
        });
      } else {
        set({
          isLoading: false,
          user: null,
          isAuthenticated: false,
          error: response.error,
        });
      }
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user',
        isAuthenticated: false,
      });
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates: Record<string, string>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authClient.updateUser(updates);
      if (response.success && response.user) {
        set({
          isLoading: false,
          user: response.user as AuthUser,
        });
        return true;
      } else {
        set({
          isLoading: false,
          error: response.error || 'Failed to update profile',
        });
        return false;
      }
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      });
      return false;
    }
  },

  /**
   * Change password
   */
  changePassword: async (oldPassword: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authClient.changePassword(oldPassword, newPassword);
      if (response && (response as Record<string, unknown>).success) {
        set({ isLoading: false });
        return true;
      } else {
        set({
          isLoading: false,
          error: (response as Record<string, unknown>).error as string || 'Failed to change password',
        });
        return false;
      }
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to change password',
      });
      return false;
    }
  },

  /**
   * Clear error message
   */
  clearError: () => set({ error: null }),

  /**
   * Set user directly
   */
  setUser: (user: AuthUser | null) => set({ user }),

  /**
   * Set authentication state
   */
  setAuthenticated: (authenticated: boolean) => {
    set({ isAuthenticated: authenticated });
    if (!authenticated) {
      set({ user: null, token: null });
    }
  },
}));

export default useAuthStore;
