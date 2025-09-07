import api from './api';

// User Profile Services
export const getProfile = () => 
  api.get('/users/profile');

export const updateProfile = (profileData) => 
  api.put('/users/profile', profileData);

export const updateLocation = (locationData) => 
  api.put('/users/location', locationData);

export const updateAvailability = (availability) => 
  api.put('/users/profile', { availability });

export const updateUserStats = (statsData) => 
  api.put('/users/stats', statsData);

export const getRegisteredHospitals = () => 
  api.get('/users/hospitals');

// Helper function to get blood group compatibility
export const getCompatibleBloodGroups = (bloodGroup) => {
  const compatibility = {
    'A+': ['A+', 'AB+'],
    'A-': ['A+', 'A-', 'AB+', 'AB-'],
    'B+': ['B+', 'AB+'],
    'B-': ['B+', 'B-', 'AB+', 'AB-'],
    'AB+': ['AB+'],
    'AB-': ['AB+', 'AB-'],
    'O+': ['A+', 'B+', 'AB+', 'O+'],
    'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  };
  
  return compatibility[bloodGroup] || [];
};

// Helper function to check if user can donate
export const canDonate = (lastDonationDate) => {
  if (!lastDonationDate) return true;
  
  const lastDonation = new Date(lastDonationDate);
  const now = new Date();
  const daysSinceLastDonation = Math.floor((now - lastDonation) / (1000 * 60 * 60 * 24));
  
  return daysSinceLastDonation >= 56; // 8 weeks
};

// Helper function to get days until next donation
export const getDaysUntilNextDonation = (lastDonationDate) => {
  if (!lastDonationDate) return 0;
  
  const lastDonation = new Date(lastDonationDate);
  const nextDonationDate = new Date(lastDonation.getTime() + (56 * 24 * 60 * 60 * 1000)); // 56 days
  const now = new Date();
  const daysUntil = Math.ceil((nextDonationDate - now) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, daysUntil);
};
