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

export interface CustomerData {
  firstName?: string;
  lastName?: string;
  streetAddress?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  phoneNumbers?: Array<{ number?: string; type?: string }>;
}

export interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  customerData: CustomerData | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  fetchCustomerData: (userIdOverride?: string) => Promise<void>;
  initializeAuth: () => Promise<void>;
  updateProfile: (updates: Record<string, string>) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  clearError: () => void;
  setUser: (user: AuthUser | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setCustomerData: (data: CustomerData | null) => void;
}

/**
 * Zustand store for authentication state management
 */
const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: authClient.getToken(),
  isAuthenticated: authClient.isAuthenticated(),
  isLoading: authClient.isAuthenticated(), // Start loading if token exists
  error: null,
  customerData: null,

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
              user: {
                ...response.user,
                role: userResponse.user.role,
                isActive: userResponse.user.isActive,
                // employeeType will be fetched separately if needed
              } as AuthUser,
            });

            // Fetch customer/employee profile data immediately after login so Profile page has data without manual refresh
            const state = get();
            await state.fetchCustomerData();
            set({ isLoading: false });
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
        customerData: null,
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
   * Initialize auth on app load - fetch user and customer data together
   */
  initializeAuth: async () => {
    if (!authClient.isAuthenticated()) {
      set({ user: null, isAuthenticated: false, customerData: null });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await authClient.getUser();
      if (response.success && response.user) {
        const user = response.user as AuthUser;
        set({
          user,
          isAuthenticated: true,
        });

        // Fetch customer data after user is set
        const token = localStorage.getItem('authToken');
        const endpoint = user.employeeType
          ? `/employees/by-user/${user.id}`
          : `/customers/by-user/${user.id}`;

        try {
          const dataResponse = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}${endpoint}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (dataResponse.ok) {
            const customerData: CustomerData = await dataResponse.json();
            set({
              isLoading: false,
              customerData,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Error fetching customer data during init:', error);
          set({ isLoading: false });
        }
      } else {
        set({
          isLoading: false,
          user: null,
          isAuthenticated: false,
          customerData: null,
          error: response.error,
        });
      }
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize auth',
        isAuthenticated: false,
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
        
        // Fetch customer data after user is fetched
        const state = get();
        if (state.user?.id) {
          await state.fetchCustomerData();
        }
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
   * Fetch customer data for logged-in user
   */
  fetchCustomerData: async (userIdOverride?: string) => {
    const state = get();
    const userId = userIdOverride || state.user?.id;
    
    if (!userId) return;

    try {
      const token = localStorage.getItem('authToken');
      
      // If employee, fetch employee data; otherwise fetch customer data
      const endpoint = state.user?.employeeType
        ? `/employees/by-user/${userId}`
        : `/customers/by-user/${userId}`;

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}${endpoint}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data: CustomerData = await response.json();
        set({ customerData: data });
      } else if (response.status !== 404) {
        console.error('Failed to fetch customer data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
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
      set({ user: null, token: null, customerData: null });
    }
  },

  /**
   * Set customer data directly
   */
  setCustomerData: (data: CustomerData | null) => set({ customerData: data }),
}));

export default useAuthStore;
