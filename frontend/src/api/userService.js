import api from './apiConfig';

export const getAllUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/users/login', { email, password });
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const blockUser = async (userId) => {
  const response = await api.put(`/users/${userId}/block`);
  return response.data;
};

export const unblockUser = async (userId) => {
  const response = await api.put(`/users/${userId}/unblock`);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

export const requestVerification = async (userData) => {
  const response = await api.post('/users/request-verification', userData);
  return response.data;
};

export const verifyEmail = async (verificationData) => {
  const response = await api.post('/users/verify-email', verificationData);
  return response.data;
};

export const resendVerificationCode = async (userData) => {
  const response = await api.post('/users/resend-verification', userData);
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await api.post('/users/request-password-reset', { email });
  return response.data;
};

export const verifyPasswordResetCode = async (codeData) => {
  const response = await api.post('/users/verify-password-reset-code', codeData);
  return response.data;
};

export const verifyPasswordReset = async (resetData) => {
  const response = await api.post('/users/verify-password-reset', resetData);
  return response.data;
};

export const resendPasswordResetCode = async (userId) => {
  const response = await api.post('/users/resend-password-reset', { userId });
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