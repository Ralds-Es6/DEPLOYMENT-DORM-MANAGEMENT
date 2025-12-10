import apiClient from './apiConfig';

// Get all admin users
export const getAllAdmins = async () => {
  try {
    const response = await apiClient.get('/users/admins/all');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Create a new admin (no email verification required)
export const createAdminAccount = async (adminData) => {
  try {
    const response = await apiClient.post('/users/admin/create-no-verify', adminData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update admin details
export const updateAdminAccount = async (adminId, adminData) => {
  try {
    const response = await apiClient.put(`/users/admin/${adminId}`, adminData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete admin account
export const deleteAdminAccount = async (adminId) => {
  try {
    const response = await apiClient.delete(`/users/admin/${adminId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
