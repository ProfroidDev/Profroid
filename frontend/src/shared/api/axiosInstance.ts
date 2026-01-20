import axios from "axios";
import useAuthStore from "../../features/authentication/store/authStore";

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false
});

// Add request interceptor to include JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for 401/403 handling
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 401 Unauthorized - clear token and redirect to login
      console.warn("Session expired - redirecting to login");
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Clear auth store
      const authStore = useAuthStore();
      authStore.logout();
      
      // Redirect to login
      window.location.href = '/auth/login?reason=session_expired';
    } else if (error.response?.status === 403) {
      // 403 Forbidden - permission denied
      console.warn("Permission denied", error.response.data);
      // Error will be handled by component/error handler
    }
    
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default axiosInstance;
