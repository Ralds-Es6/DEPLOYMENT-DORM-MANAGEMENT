import axios from 'axios';
import { BASE_URL } from './apiConfig';

const api = axios.create({
  baseURL: `${BASE_URL}/reports`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
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
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Submit a new report
export const submitReport = async (reportData) => {
  try {
    const response = await api.post('/', reportData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get user's reports
export const getUserReports = async () => {
  try {
    const response = await api.get('/my-reports');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get all reports (Admin)
export const getAllReports = async () => {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get single report
export const getReportById = async (id) => {
  try {
    const response = await api.get(`/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update report status and remarks (Admin)
export const updateReport = async (id, updateData) => {
  try {
    const response = await api.put(`/${id}`, updateData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Delete report (Admin)
export const deleteReport = async (id) => {
  try {
    const response = await api.delete(`/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
