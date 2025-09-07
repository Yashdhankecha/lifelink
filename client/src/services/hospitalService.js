import api from './api';

// Hospital Profile Management
export const getHospitalProfile = async () => {
  try {
    const response = await api.get('/hospital/profile');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateHospitalProfile = async (profileData) => {
  try {
    const response = await api.patch('/hospital/profile', profileData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Blood Request Management
export const createBloodRequest = async (requestData) => {
  try {
    const response = await api.post('/hospital/requests', requestData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getHospitalRequests = async (filters = {}) => {
  try {
    const response = await api.get('/hospital/requests', { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const confirmBloodRequest = async (requestId) => {
  try {
    const response = await api.patch(`/hospital/requests/${requestId}/confirm`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const completeBloodRequest = async (requestId) => {
  try {
    console.log('Attempting to complete request:', requestId);
    const response = await api.patch(`/hospital/requests/${requestId}/complete`);
    console.log('Complete request response:', response);
    return response.data;
  } catch (error) {
    console.error('Error completing request:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

export const cancelBloodRequest = async (requestId) => {
  try {
    const response = await api.patch(`/hospital/requests/${requestId}/cancel`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Donor Management
export const getAcceptedDonors = async () => {
  try {
    const response = await api.get('/hospital/donors');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Debug function to see all requests
export const debugHospitalRequests = async () => {
  try {
    const response = await api.get('/hospital/debug-requests');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Analytics
export const getHospitalAnalytics = async (timeRange = '6months') => {
  try {
    const response = await api.get('/hospital/analytics', { 
      params: { timeRange } 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Password Management
export const changeHospitalPassword = async (passwordData) => {
  try {
    const response = await api.patch('/hospital/password', passwordData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Notification Settings
export const updateNotificationSettings = async (settings) => {
  try {
    const response = await api.patch('/hospital/notifications', settings);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getNotificationSettings = async () => {
  try {
    const response = await api.get('/hospital/notifications');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addDirectDonor = async (donorData) => {
  try {
    const response = await api.post('/hospital/donors/add-direct', donorData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

