import axios from 'axios';

const API_URL = '/api';

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
    console.log('Making API request to:', config.url);
    console.log('Request method:', config.method);
    console.log('With credentials:', config.withCredentials);
    console.log('Cookies:', document.cookie);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    // Only log non-401 errors to reduce console noise
    if (error.response?.status !== 401) {
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
