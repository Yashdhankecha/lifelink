import api from './api';

// Admin Dashboard Analytics
export const getDashboardAnalytics = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

// User Management
export const getAllUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const getUserDetails = async (userId) => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

export const updateUserStatus = async (userId, statusData) => {
  const response = await api.put(`/admin/users/${userId}/status`, statusData);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

// Request Management
export const getAllRequests = async (params = {}) => {
  const response = await api.get('/admin/requests', { params });
  return response.data;
};

export const updateRequestStatus = async (requestId, statusData) => {
  const response = await api.put(`/admin/requests/${requestId}/status`, statusData);
  return response.data;
};

// Reports and Analytics
export const getSystemReports = async (params = {}) => {
  const response = await api.get('/admin/reports', { params });
  return response.data;
};
