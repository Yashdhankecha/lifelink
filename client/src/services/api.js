import axios from 'axios';

// Use environment variable for API URL, fallback to Render backend
const API_URL = import.meta.env.VITE_API_URL || 'https://your-render-backend.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Only log in development or when debug is enabled
    if (import.meta.env.VITE_ENABLE_DEBUG === 'true' || import.meta.env.DEV) {
      console.log('Making API request to:', config.url);
      console.log('Request method:', config.method);
      console.log('With credentials:', config.withCredentials);
      console.log('Cookies:', document.cookie);
      console.log('API Base URL:', API_URL);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Only log in development or when debug is enabled
    if (import.meta.env.VITE_ENABLE_DEBUG === 'true' || import.meta.env.DEV) {
      console.log('API response received:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    // Only log non-401 errors to reduce console noise
    if (error.response?.status !== 401 && (import.meta.env.VITE_ENABLE_DEBUG === 'true' || import.meta.env.DEV)) {
      console.log('API error received:', error.response?.status, error.config?.url);
      console.log('Error response data:', error.response?.data);
    }
    // Don't redirect on 401 errors - let components handle it
    // This prevents automatic page reloads
    return Promise.reject(error);
  }
);

// User services
export const updateUserLocation = (location) => api.put('/users/location', { location });
export const getUserProfile = () => api.get('/users/profile');
export const updateUserProfile = (profileData) => api.put('/users/profile', profileData);

export default api;
