import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { 
  getNearbyRequests, 
  acceptBloodRequest, 
  getMyRequests, 
  getDonationStats,
  getStatusColor,
  getUrgencyColor,
  formatDate,
  calculateDistance
} from '../services/requestService';
import { updateUserProfile } from '../services/api';
import { 
  Heart, 
  MapPin, 
  Calendar, 
  Users, 
  Activity, 
  Award, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const DonorDashboard = () => {
  const { user, updateUser } = useAuth();
  const { latitude, longitude, error: locationError, getCurrentLocation } = useGeolocation();
  
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acceptingRequest, setAcceptingRequest] = useState(null);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [localAvailability, setLocalAvailability] = useState(user?.availability);

  useEffect(() => {
    if (user) {
      setLocalAvailability(user.availability);
      fetchDashboardData();
    }
  }, [user]);

  const fetchNearbyRequests = async () => {
    if (latitude && longitude && localAvailability) {
      try {
        const nearbyResponse = await getNearbyRequests(latitude, longitude);
        setNearbyRequests(nearbyResponse.data.data || []);
      } catch (error) {
        console.log('No nearby requests found or error fetching:', error);
        setNearbyRequests([]);
      }
    } else if (!localAvailability) {
      // Clear nearby requests if user is not available
      setNearbyRequests([]);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch nearby requests
      await fetchNearbyRequests();
      
      // Fetch donation history (completed donations where user is donor)
      try {
        const historyResponse = await getMyRequests('completed', 'accepted');
        setDonationHistory(historyResponse.data.data || []);
      } catch (error) {
        console.log('No donation history found or error fetching:', error);
        setDonationHistory([]);
      }
      
      // Fetch stats and badges
      try {
        const statsResponse = await getDonationStats();
        const statsData = statsResponse.data.data;
        
        
        setStats(statsData);
      } catch (error) {
        console.log('No stats found or error fetching:', error);
        setStats({ totalDonations: 0, badges: [] });
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setAcceptingRequest(requestId);
      console.log('Attempting to accept request:', requestId);
      
      const response = await acceptBloodRequest(requestId);
      console.log('Accept request response:', response);
      
      // Show hospital details in success message
      const hospitalDetails = response.data.hospitalDetails;
      if (hospitalDetails) {
        toast.success(
          `Request accepted! Hospital: ${hospitalDetails.hospitalName}\nAddress: ${hospitalDetails.hospitalAddress}\nContact: ${hospitalDetails.requesterName} - ${hospitalDetails.requesterPhone}`,
          { duration: 8000 }
        );
      } else {
        toast.success('Request accepted successfully!');
      }
      
      // Remove the accepted request from nearby requests without full reload
      setNearbyRequests(prev => prev.filter(request => request._id !== requestId));
      
      // Update donation history without full reload
      try {
        const historyResponse = await getMyRequests('completed', 'accepted');
        setDonationHistory(historyResponse.data.data || []);
      } catch (error) {
        console.log('Error updating donation history:', error);
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.message || 'Failed to accept request');
    } finally {
      setAcceptingRequest(null);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      setUpdatingAvailability(true);
      const newAvailability = !localAvailability;
      
      // Update local state immediately for instant UI feedback
      setLocalAvailability(newAvailability);
      
      // Update backend
      await updateUserProfile({ availability: newAvailability });
      
      // Update context without causing a reload
      updateUser({ ...user, availability: newAvailability });
      
      // Update nearby requests based on new availability
      if (!newAvailability) {
        setNearbyRequests([]);
      } else if (latitude && longitude) {
        try {
          const nearbyResponse = await getNearbyRequests(latitude, longitude);
          setNearbyRequests(nearbyResponse.data.data || []);
        } catch (error) {
          console.log('No nearby requests found:', error);
          setNearbyRequests([]);
        }
      }
      
      toast.success(`Availability ${newAvailability ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
      // Revert local state on error
      setLocalAvailability(!localAvailability);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleLocationEnabled = async () => {
    // Refresh nearby requests when location is enabled
    await fetchNearbyRequests();
  };

  // Effect to refresh nearby requests when location changes
  useEffect(() => {
    if (latitude && longitude) {
      handleLocationEnabled();
    }
  }, [latitude, longitude]);

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="h-4 w-4" />,
      accepted: <CheckCircle className="h-4 w-4" />,
      on_the_way: <Activity className="h-4 w-4" />,
      completed: <CheckCircle className="h-4 w-4" />,
      cancelled: <XCircle className="h-4 w-4" />
    };
    return icons[status] || <AlertCircle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-200 mx-auto mb-4"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            <Heart className="h-6 w-6 text-red-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-heartbeat" />
          </div>
          <p className="text-gray-600 text-lg font-medium animate-pulse-slow">Loading dashboard<span className="loading-dots"></span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-gray-900 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Donor Dashboard
          </h1>
          <p className="text-gray-600 mt-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Help save lives by donating blood to those in need
          </p>
        </div>

        {/* Donor Profile Card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8 transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center animate-pulse-slow shadow-lg">
                  <Heart className="h-8 w-8 text-red-600 animate-heartbeat" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    {user?.bloodGroup}
                  </span>
                  <span className="text-gray-600">
                    Last donation: {user?.lastDonationDate ? formatDate(user.lastDonationDate) : 'Never'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Availability</p>
                <button
                  onClick={handleToggleAvailability}
                  disabled={updatingAvailability}
                  className="flex items-center space-x-2 text-lg font-medium"
                >
                  {localAvailability ? (
                    <>
                      <ToggleRight className="h-6 w-6 text-green-600" />
                      <span className="text-green-600">Available</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                      <span className="text-gray-500">Not Available</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-br from-red-100 to-red-200 rounded-md flex items-center justify-center animate-bounce-slow">
                  <Heart className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Donations</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalDonations || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-md flex items-center justify-center animate-bounce-slow">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Nearby Requests</p>
                <p className="text-2xl font-bold text-gray-900">{nearbyRequests.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-br from-green-100 to-green-200 rounded-md flex items-center justify-center animate-bounce-slow">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Badges Earned</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.badges?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-md flex items-center justify-center animate-bounce-slow">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Last Donation</p>
                <p className="text-lg font-bold text-gray-900">
                  {user?.lastDonationDate ? 
                    Math.floor((new Date() - new Date(user.lastDonationDate)) / (1000 * 60 * 60 * 24)) + ' days ago' : 
                    'Never'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Nearby Requests */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 transform hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-red-600 animate-pulse" />
                Nearby Requests
                {locationError && (
                  <span className="ml-2 text-sm text-red-600 animate-pulse">(Location required)</span>
                )}
              </h3>
            </div>
            <div className="p-6">
              {!localAvailability ? (
                <div className="text-center py-8">
                  <ToggleLeft className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Enable availability to see nearby requests</p>
                  <p className="text-sm text-gray-400">Toggle your availability status above to help others</p>
                </div>
              ) : !latitude || !longitude ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Location access needed to find nearby requests</p>
                  <button
                    onClick={getCurrentLocation}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Enable Location
                  </button>
                </div>
              ) : nearbyRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No nearby requests found</p>
                  <p className="text-sm text-gray-400">Check back later for new requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {nearbyRequests.map((request, index) => (
                    <div key={request._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${0.9 + index * 0.1}s` }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {request.bloodGroup} Blood Needed
                          </h4>
                          <p className="text-sm text-gray-600">{request.hospitalName}</p>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                            {request.urgency}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          {request.unitsNeeded} unit{request.unitsNeeded > 1 ? 's' : ''} needed
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          {request.hospitalAddress}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {formatDate(request.createdAt)}
                        </div>
                        {latitude && longitude && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Activity className="h-4 w-4 mr-2" />
                            {calculateDistance(latitude, longitude, request.location.latitude, request.location.longitude)} km away
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleAcceptRequest(request._id)}
                          disabled={acceptingRequest === request._id}
                          className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-md hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          {acceptingRequest === request._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            'Accept Request'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Donation History */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 transform hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '1.0s' }}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600 animate-pulse" />
                Donation History
              </h3>
            </div>
            <div className="p-6">
              {donationHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No donation history yet</p>
                  <p className="text-sm text-gray-400">Start helping by accepting requests!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {donationHistory.slice(0, 5).map((request, index) => (
                    <div key={request._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${1.1 + index * 0.1}s` }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {request.status === 'accepted' ? 'Accepted' : 'Donated'} {request.bloodGroup} blood {request.status === 'accepted' ? 'for' : 'to'} {request.requesterId?.name}
                          </h4>
                          <p className="text-sm text-gray-600">{request.hospitalName}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status.replace('_', ' ')}</span>
                        </span>
                      </div>

                      {/* Hospital Contact Details - Show for accepted requests */}
                      {request.status === 'accepted' && request.requesterId && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h5 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Hospital Contact Details
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-blue-700"><strong>Hospital:</strong> {request.hospitalName}</p>
                              <p className="text-blue-700"><strong>Address:</strong> {request.hospitalAddress}</p>
                            </div>
                            <div>
                              {request.requesterId.phone && (
                                <p className="text-blue-700">
                                  <strong>Contact:</strong> 
                                  <a href={`tel:${request.requesterId.phone}`} className="text-blue-600 hover:text-blue-800 ml-1">
                                    {request.requesterId.phone}
                                  </a>
                                </p>
                              )}
                              {request.requesterId.email && (
                                <p className="text-blue-700">
                                  <strong>Email:</strong> 
                                  <a href={`mailto:${request.requesterId.email}`} className="text-blue-600 hover:text-blue-800 ml-1">
                                    {request.requesterId.email}
                                  </a>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-gray-600">
                        <p>Accepted: {formatDate(request.acceptedAt)}</p>
                        {request.completedAt && (
                          <p>Completed: {formatDate(request.completedAt)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Badges Section */}
        {stats?.badges && stats.badges.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-lg border border-gray-200 transform hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Award className="h-5 w-5 mr-2 text-yellow-600 animate-bounce" />
                Your Badges
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.badges.map((badge, index) => (
                  <div key={index} className={`flex items-center space-x-3 p-4 rounded-lg border hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fade-in-up ${
                    badge.earned 
                      ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' 
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`} style={{ animationDelay: `${1.3 + index * 0.1}s` }}>
                    <div className="text-2xl">{badge.icon}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{badge.name}</h4>
                      <p className="text-sm text-gray-600">{badge.description}</p>
                      {badge.earned && (
                        <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium mt-1">
                          ✓ Earned
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDashboard;
