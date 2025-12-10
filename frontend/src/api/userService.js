import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
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

export const getAllUsers = async () => {
  const response = await api.get('/');
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/', userData);
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/login', { email, password });
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export const blockUser = async (userId) => {
  const response = await api.put(`/${userId}/block`);
  return response.data;
};

export const unblockUser = async (userId) => {
  const response = await api.put(`/${userId}/unblock`);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/${userId}`);
  return response.data;
};

export const requestVerification = async (userData) => {
  const response = await api.post('/request-verification', userData);
  return response.data;
};

export const verifyEmail = async (verificationData) => {
  const response = await api.post('/verify-email', verificationData);
  return response.data;
};

export const resendVerificationCode = async (userData) => {
  const response = await api.post('/resend-verification', userData);
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await api.post('/request-password-reset', { email });
  return response.data;
};

export const verifyPasswordResetCode = async (codeData) => {
  const response = await api.post('/verify-password-reset-code', codeData);
  return response.data;
};

export const verifyPasswordReset = async (resetData) => {
  const response = await api.post('/verify-password-reset', resetData);
  return response.data;
};

export const resendPasswordResetCode = async (userId) => {
  const response = await api.post('/resend-password-reset', { userId });
  return response.data;
};

export const userService = {
  getAllUsers,
  register,
  login,
  getUserProfile,
  blockUser,
  unblockUser,
  deleteUser,
  requestVerification,
  verifyEmail,
  resendVerificationCode,
  requestPasswordReset,
  verifyPasswordResetCode,
  verifyPasswordReset,
  resendPasswordResetCode
};