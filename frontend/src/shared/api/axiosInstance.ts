import axios from "axios";

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

// OPTIONAL: Add simple global error interceptor
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    console.error("API Error:", error);

    // You can customize this later if needed:
    // if (error.response?.status === 401) { ... }

    return Promise.reject(error);
  }
);

export default axiosInstance;
