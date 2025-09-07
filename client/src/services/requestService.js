import api from './api';

// Blood Request Services
export const createBloodRequest = (requestData) => 
  api.post('/requests', requestData);

export const getAllRequests = (status = 'pending', limit = 50, compatible = false) => 
  api.get('/requests/all', {
    params: { status, limit, compatible }
  });

export const getCompatibleRequests = (status = 'pending', limit = 20) => 
  api.get('/requests/compatible', {
    params: { status, limit }
  });

export const getNearbyRequests = (latitude, longitude, radius = 10) => 
  api.get('/requests/nearby', {
    params: { latitude, longitude, radius }
  });

export const acceptBloodRequest = (requestId) => 
  api.patch(`/requests/${requestId}/accept`);

export const confirmBloodRequest = (requestId) => 
  api.post(`/requests/${requestId}/confirm`);

export const completeBloodRequest = (requestId) => 
  api.post(`/requests/${requestId}/complete`);

export const updateRequestStatus = (requestId, status) => 
  api.patch(`/requests/${requestId}/status`, { status });

export const getMyRequests = (status = null, type = null) => {
  const params = {};
  if (status) params.status = status;
  if (type) params.type = type;
  
  return api.get('/requests/my', { params });
};

export const getDonationStats = () => 
  api.get('/requests/stats');

export const updateBloodRequest = (requestId, requestData) => 
  api.put(`/requests/${requestId}`, requestData);

export const deleteBloodRequest = (requestId) => {
  console.log('Making DELETE request to:', `/requests/${requestId}`);
  console.log('Full URL would be:', `/api/requests/${requestId}`);
  console.log('Request ID:', requestId);
  console.log('Request ID type:', typeof requestId);
  return api.delete(`/requests/${requestId}`);
};

// Helper function to get status color
export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Helper function to get urgency color
export const getUrgencyColor = (urgency) => {
  const colors = {
    normal: 'bg-green-100 text-green-800',
    critical: 'bg-red-100 text-red-800'
  };
  return colors[urgency] || 'bg-gray-100 text-gray-800';
};

// Helper function to format date
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function to calculate distance
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
};
