import axios from 'axios';

// Determine API origin based on environment
const getApiOrigin = () => {
  // Check if we're in production (deployed domain)
  if (window.location.hostname === 'karmidorm.site') {
    return 'https://karmidorm.site';
  }
  // Use environment variable or fallback to localhost
  return import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';
};

const API_ORIGIN = getApiOrigin();
export const BASE_URL = `${API_ORIGIN}/api`;

export const MEDIA_BASE_URL = API_ORIGIN;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true
});

// Add auth token to requests if it exists
api.interceptors.request.use(
  (config) => {
    // Check both adminInfo and userInfo for token
    const adminInfo = localStorage.getItem('adminInfo');
    const userInfo = localStorage.getItem('userInfo');
    
    try {
      if (adminInfo) {
        const { token } = JSON.parse(adminInfo);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else if (userInfo) {
        const { token } = JSON.parse(userInfo);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Error parsing auth info:', error);
      // Clear invalid data
      localStorage.removeItem('userInfo');
      localStorage.removeItem('adminInfo');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and token validation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect to login for public routes
    const isPublicRoute = error.config?.url?.includes('/public');
    
    if (error.response?.status === 401 && !isPublicRoute) {
      // Clear invalid tokens from both keys
      localStorage.removeItem('userInfo');
      localStorage.removeItem('adminInfo');
      // Only redirect if not already on login/register pages
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register') && !currentPath.includes('/browse-rooms')) {
        window.location.href = '/login';
      }
    }
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.message || 'An error occurred');
    } else if (error.request) {
      // Request made but no response
      throw new Error('Unable to connect to the server. Please check your connection.');
    } else {
      // Request setup error
      throw new Error('An error occurred while setting up the request.');
    }
  }
);

export default api;