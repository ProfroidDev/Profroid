import axios from "axios";
import { handle403Redirect } from "../../utils/403Handler";

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

// Global error interceptor for handling 403 errors
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    console.error("API Error:", error);

    // Handle 403 Forbidden errors
    if (error.response?.status === 403) {
      handle403Redirect();
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
