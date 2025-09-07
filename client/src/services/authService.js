import api from './api';

// User authentication
export const registerUser = async (userData) => {
  const response = await api.post('/auth/user/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/user/login', credentials);
  return response.data;
};

// Hospital authentication
export const registerHospital = async (hospitalData) => {
  const response = await api.post('/auth/hospital/register', hospitalData);
  return response.data;
};

export const loginHospital = async (credentials) => {
  const response = await api.post('/auth/hospital/login', credentials);
  return response.data;
};

// Admin authentication
export const registerAdmin = async (adminData) => {
  const response = await api.post('/auth/admin/register', adminData);
  return response.data;
};

export const loginAdmin = async (credentials) => {
  const response = await api.post('/auth/admin/login', credentials);
  return response.data;
};

// Common authentication
export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// OTP functions
export const sendOTP = async (data) => {
  const response = await api.post('/auth/send-otp', data);
  return response.data;
};

export const verifyOTP = async (data) => {
  const response = await api.post('/auth/verify-otp', data);
  return response.data;
};

export const resendOTP = async (data) => {
  const response = await api.post('/auth/resend-otp', data);
  return response.data;
};
