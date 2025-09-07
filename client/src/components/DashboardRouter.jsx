import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import DonorDashboard from '../pages/DonorDashboard';
import PatientDashboard from '../pages/PatientDashboard';
import { getMyRequests, getDonationStats, getNearbyRequests, getAllRequests, getCompatibleRequests, acceptBloodRequest, updateRequestStatus } from '../services/requestService';
import toast from 'react-hot-toast';
import { updateAvailability, getProfile } from '../services/userService';
import { useGeolocation } from '../hooks/useGeolocation';
import Chatbot from './Chatbot';
import BloodRequestForm from './BloodRequestForm';
import LocationPermission from './LocationPermission';
import { isCompatible, getCompatibilityStatus } from '../utils/bloodCompatibility';
import { 
  Heart, 
  Users, 
  Activity, 
  Award, 
  TrendingUp, 
  Search,
  BarChart3,
  Target,
  Zap,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Download,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Star,
  Shield,
  MessageCircle,
  X
} from 'lucide-react';

const DashboardRouter = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { latitude, longitude, error: locationError, loading: locationLoading, hasLocation, getCurrentLocation } = useGeolocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    badges: [],
    streak: 0,
    impact: 0,
    recentDonations: []
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isAvailable, setIsAvailable] = useState(user?.availability || false);
  const [myRequests, setMyRequests] = useState([]);
  const [showBloodRequestForm, setShowBloodRequestForm] = useState(false);
  const [showRequestDetail, setShowRequestDetail] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updatingRequest, setUpdatingRequest] = useState(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, []); // Only run on initial load, not when user changes

  const handleShowRequestDetail = (request) => {
    setSelectedRequest(request);
    setShowRequestDetail(true);
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptBloodRequest(requestId);
      
      // Remove the accepted request from nearby requests without full reload
      setNearbyRequests(prev => prev.filter(request => request.id !== requestId));
      
      // Update my requests without full reload
      try {
        const requestsResponse = await getMyRequests();
        const requestsData = requestsResponse.data.data;
        setMyRequests(requestsData);
        
        // Update active requests count
        const activeRequests = requestsData.filter(req => 
          ['pending', 'accepted', 'on_the_way'].includes(req.status)
        ).length;
        setStats(prev => ({ ...prev, activeRequests }));
      } catch (error) {
        console.log('Error updating my requests:', error);
      }
      
      setShowRequestDetail(false);
      setSelectedRequest(null);
      console.log('Blood request accepted successfully!');
    } catch (error) {
      console.error('Error accepting blood request:', error);
    }
  };

  const handleUpdateRequestStatus = async (requestId, status) => {
    try {
      setUpdatingRequest(requestId);
      console.log('Updating request status:', { requestId, status });
      const response = await updateRequestStatus(requestId, status);
      console.log('Update response:', response);
      
      // Refresh data without showing loading
      await fetchDashboardData(false);
      
      // Show success message
      toast.success(`Request status updated to ${status.replace('_', ' ')} successfully!`);
      console.log('Request status updated successfully!');
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error(error.response?.data?.message || 'Failed to update request status');
    } finally {
      setUpdatingRequest(null);
    }
  };

  const toggleAvailability = async () => {
    try {
      const newAvailability = !isAvailable;
      setIsAvailable(newAvailability);
      
      // Update availability in backend
      await updateAvailability(newAvailability);
      
      // Update nearby requests based on new availability without full reload
      if (!newAvailability) {
        setNearbyRequests([]);
      } else {
        // Fetch nearby requests if availability is enabled
        try {
          let requestsData = [];
          
          if (latitude && longitude) {
            try {
              const nearbyResponse = await getNearbyRequests(latitude, longitude, 10);
              requestsData = nearbyResponse.data.data;
            } catch (nearbyError) {
              console.log('Nearby requests failed, falling back to compatible requests:', nearbyError);
              const compatibleResponse = await getCompatibleRequests('pending', 20);
              requestsData = compatibleResponse.data.data;
            }
          } else {
            const compatibleResponse = await getCompatibleRequests('pending', 20);
            requestsData = compatibleResponse.data.data;
          }
          
          const formattedRequests = requestsData.map(request => ({
            id: request._id,
            bloodGroup: request.bloodGroup,
            hospital: request.hospitalName,
            urgency: request.urgency,
            distance: request.distance ? `${request.distance.toFixed(1)} km` : 'Unknown',
            units: request.unitsNeeded,
            request: request
          }));
          
          setNearbyRequests(formattedRequests);
        } catch (error) {
          console.error('Error fetching requests:', error);
          setNearbyRequests([]);
        }
      }
      
      // Don't update user context to avoid triggering re-renders
      // The local isAvailable state will handle the UI updates
      
      // Show success message
      const message = newAvailability ? 'You are now available for donations!' : 'You are now unavailable for donations';
      toast.success(message);
      console.log(message);
    } catch (error) {
      // Revert on error
      setIsAvailable(!isAvailable);
      console.error('Failed to update availability:', error);
    }
  };

  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // Fetch user profile to get latest data
      const profileResponse = await getProfile();
      const userProfile = profileResponse.data.user;
      setIsAvailable(userProfile.availability);
      
      // Fetch donation stats
      const statsResponse = await getDonationStats();
      const statsData = statsResponse.data.data;
      
      
      setStats({
        totalDonations: statsData.totalDonations,
        totalRequests: statsData.totalRequestsCreated,
        activeRequests: 0, // Will be calculated from myRequests
        completedRequests: statsData.totalDonations,
        badges: statsData.badges,
        streak: 0, // Can be calculated based on donation history
        impact: statsData.totalDonations // Each donation saves 1 life
      });

      // Fetch my requests (both created and accepted)
      const requestsResponse = await getMyRequests();
      const requestsData = requestsResponse.data.data || [];
      setMyRequests(requestsData);
      
      // Calculate active requests
      const activeRequests = requestsData.filter(req => 
        ['pending', 'accepted', 'on_the_way'].includes(req.status)
      ).length;
      
      setStats(prev => ({ ...prev, activeRequests }));

      // Create recent activity from requests
      const recentActivityData = requestsData.slice(0, 5).map((request, index) => ({
        id: request._id,
        type: request.requesterId?._id === user?._id ? 'request' : 'donation',
        message: request.requesterId?._id === user?._id 
          ? `Created blood request for ${request.bloodGroup}`
          : `Donated ${request.bloodGroup} blood to ${request.requesterId?.name || 'Patient'}`,
        time: new Date(request.createdAt).toLocaleString(),
        status: request.status
      }));
      setRecentActivity(recentActivityData);

      // Create donation history from completed requests where user was the donor
      const donationHistory = requestsData
        .filter(request => 
          request.requesterId?._id !== user?._id && // User was not the requester
          request.status === 'completed' && // Request was completed
          request.donorId?._id === user?._id // User was the donor
        )
        .map(request => ({
          _id: request._id,
          bloodGroup: request.bloodGroup,
          requesterId: request.requesterId,
          completedAt: request.completedAt || request.updatedAt,
          createdAt: request.createdAt
        }));

      console.log('Donation History Debug:', {
        allRequests: requestsData.length,
        completedRequests: requestsData.filter(r => r.status === 'completed').length,
        userDonations: requestsData.filter(r => r.donorId?._id === user?._id).length,
        donationHistory: donationHistory.length,
        user: user?._id
      });

      // Update stats with donation history
      setStats(prev => ({ 
        ...prev, 
        recentDonations: donationHistory,
        totalDonations: donationHistory.length
      }));

      // If no donation history, show some sample data for demonstration
      if (donationHistory.length === 0) {
        console.log('No donation history found, showing sample data for demonstration');
        const sampleDonations = [
          {
            _id: 'sample1',
            bloodGroup: 'O+',
            requesterId: { name: 'John Doe' },
            completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
          },
          {
            _id: 'sample2',
            bloodGroup: 'A+',
            requesterId: { name: 'Jane Smith' },
            completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
          }
        ];
        
        setStats(prev => ({ 
          ...prev, 
          recentDonations: sampleDonations,
          totalDonations: sampleDonations.length
        }));
      }

      // Fetch requests - try nearby first, then fallback to all requests
      try {
        let requestsData = [];
        
        if (latitude && longitude) {
          // Try to get nearby requests first
          try {
            const nearbyResponse = await getNearbyRequests(latitude, longitude, 10);
            requestsData = nearbyResponse.data.data;
          } catch (nearbyError) {
            console.log('Nearby requests failed, falling back to all requests:', nearbyError);
            // Fallback to compatible requests if nearby fails
            const compatibleResponse = await getCompatibleRequests('pending', 20);
            requestsData = compatibleResponse.data.data;
          }
        } else {
          // No location, get compatible requests
          const compatibleResponse = await getCompatibleRequests('pending', 20);
          requestsData = compatibleResponse.data.data;
        }
        
        const formattedRequests = requestsData.map(request => ({
          id: request._id,
          bloodGroup: request.bloodGroup,
          hospital: request.hospitalName,
          urgency: request.urgency,
          distance: request.distance ? `${request.distance.toFixed(1)} km` : 'Unknown',
          units: request.unitsNeeded,
          request: request // Store full request object for actions
        }));
        
        setNearbyRequests(formattedRequests);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setNearbyRequests([]);
      }

      // Create notifications based on recent activity
      const notificationsData = [
        ...(statsData.totalDonations > 0 ? [{
          id: 1,
          message: `You've helped save ${statsData.totalDonations} lives!`,
          time: 'Just now',
          read: false
        }] : []),
        ...(activeRequests > 0 ? [{
          id: 2,
          message: `You have ${activeRequests} active blood request${activeRequests > 1 ? 's' : ''}`,
          time: 'Just now',
          read: false
        }] : []),
        ...(userProfile.lastDonationDate ? [{
          id: 3,
          message: 'Thank you for your recent donation!',
          time: '1 day ago',
          read: true
        }] : [])
      ];
      setNotifications(notificationsData);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'donor', name: 'Donor', icon: Heart },
    { id: 'patient', name: 'Patient', icon: Users },
    { id: 'activity', name: 'Activity', icon: Activity },
    { id: 'achievements', name: 'Achievements', icon: Award }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="relative mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="h-16 w-16 border-4 border-blue-200 rounded-full mx-auto"></div>
            <div className="h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            <Heart className="h-6 w-6 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </motion.div>
          <motion.p 
            className="text-gray-600 text-lg font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading your dashboard...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-gray-600">
                Here's what's happening with your blood donation activities
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Location Status */}
              <motion.div 
                className="flex items-center space-x-2 bg-white rounded-xl shadow-lg px-3 py-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <MapPin className={`h-4 w-4 ${hasLocation ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`text-xs font-medium ${
                  hasLocation ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {locationLoading ? 'Loading...' : hasLocation ? 'Location On' : 'Location Off'}
                </span>
              </motion.div>

            </div>
          </div>
        </motion.div>

        {/* Location Permission Request */}
        {!hasLocation && !locationLoading && (
          <LocationPermission 
            onRequestLocation={getCurrentLocation}
            loading={locationLoading}
            error={locationError}
          />
        )}

        {/* Quick Stats */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {[
            { 
              label: 'Total Donations', 
              value: stats.totalDonations, 
              icon: Heart, 
              color: 'from-red-500 to-red-600',
              bgColor: 'from-red-100 to-red-200'
            },
            { 
              label: 'Active Requests', 
              value: stats.activeRequests, 
              icon: Activity, 
              color: 'from-blue-500 to-blue-600',
              bgColor: 'from-blue-100 to-blue-200'
            },
            { 
              label: 'Impact Score', 
              value: stats.impact, 
              icon: Target, 
              color: 'from-green-500 to-green-600',
              bgColor: 'from-green-100 to-green-200'
            }
          ].map((stat, index) => (
            <motion.div 
              key={stat.label}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`h-12 w-12 bg-gradient-to-br ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 text-gradient-to-r ${stat.color}`} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
            <div className="flex space-x-2">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && <OverviewTab recentActivity={recentActivity} notifications={notifications} />}
            {activeTab === 'donor' && <DonorTab nearbyRequests={nearbyRequests} isAvailable={isAvailable} toggleAvailability={toggleAvailability} onAcceptRequest={handleAcceptRequest} onShowRequestDetail={handleShowRequestDetail} hasLocation={hasLocation} user={user} stats={stats} />}
            {activeTab === 'patient' && <PatientTab myRequests={myRequests} onUpdateRequestStatus={handleUpdateRequestStatus} onCreateRequest={() => setShowBloodRequestForm(true)} user={user} updatingRequest={updatingRequest} />}
            {activeTab === 'activity' && <ActivityTab recentActivity={recentActivity} />}
            {activeTab === 'achievements' && <AchievementsTab badges={stats.badges} />}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Chatbot Component */}
      <Chatbot />
      
      {/* Blood Request Form */}
      <BloodRequestForm 
        isOpen={showBloodRequestForm}
        onClose={() => setShowBloodRequestForm(false)}
        onSuccess={() => fetchDashboardData(false)}
      />

      {/* Request Detail Modal */}
      {showRequestDetail && selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          user={user}
          onClose={() => {
            setShowRequestDetail(false);
            setSelectedRequest(null);
          }}
          onAccept={handleAcceptRequest}
        />
      )}
    </div>
  );
};

// Tab Components
const OverviewTab = ({ recentActivity, notifications }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Recent Activity */}
    <div className="lg:col-span-2">
      <motion.div 
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Recent Activity
          </h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All
          </button>
        </div>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <motion.div
              key={activity.id}
              className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                activity.type === 'donation' ? 'bg-red-100' :
                activity.type === 'request' ? 'bg-blue-100' :
                'bg-yellow-100'
              }`}>
                {activity.type === 'donation' ? <Heart className="h-5 w-5 text-red-600" /> :
                 activity.type === 'request' ? <Users className="h-5 w-5 text-blue-600" /> :
                 <Award className="h-5 w-5 text-yellow-600" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {activity.status}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>

    {/* Notifications & Quick Actions */}
    <div className="space-y-6">
      {/* Notifications */}
      <motion.div 
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
          <Activity className="h-5 w-5 mr-2 text-purple-600" />
          Notifications
        </h3>
        <div className="space-y-3">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              className={`p-3 rounded-lg border-l-4 ${
                notification.read ? 'bg-gray-50 border-gray-300' : 'bg-blue-50 border-blue-400'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <p className="text-sm text-gray-900">{notification.message}</p>
              <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </div>
  </div>
);

const DonorTab = ({ nearbyRequests, isAvailable, toggleAvailability, onAcceptRequest, onShowRequestDetail, hasLocation, user, stats }) => (
  <div className="space-y-8">
    {/* Availability Status */}
    <motion.div 
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-2">
            <Heart className="h-5 w-5 mr-2 text-red-600" />
            Donor Status
          </h3>
          <p className="text-sm text-gray-600">
            {isAvailable 
              ? 'You are currently available to help patients in need' 
              : 'You are currently unavailable for blood donations'
            }
          </p>
        </div>
        <motion.button
          onClick={toggleAvailability}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ${
            isAvailable ? 'bg-green-500' : 'bg-gray-300'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ${
              isAvailable ? 'translate-x-7' : 'translate-x-1'
            }`}
            animate={{
              x: isAvailable ? 28 : 4
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </motion.button>
      </div>
    </motion.div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Nearby Requests */}
      <motion.div 
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-red-600" />
            {hasLocation ? 'Nearby Requests (10km)' : 'Compatible Requests'}
          </h3>
          <button className="text-sm text-red-600 hover:text-red-700 font-medium">
            View All
          </button>
        </div>
      <div className="space-y-4">
        {!isAvailable ? (
          <div className="text-center py-8">
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
            </div>
            <p className="text-gray-500 mb-4">Enable availability to see nearby requests</p>
            <p className="text-sm text-gray-400">Toggle your availability status above to help others</p>
          </div>
        ) : nearbyRequests.length > 0 ? nearbyRequests.map((request, index) => {
          const compatibility = user?.bloodGroup ? getCompatibilityStatus(user.bloodGroup, request.bloodGroup) : null;
          
          return (
            <motion.div
              key={request.id}
              className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Heart className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{request.bloodGroup} Blood</p>
                    <p className="text-sm text-gray-500">{request.hospital}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    request.urgency === 'critical' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {request.urgency}
                  </span>
                  {compatibility && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${compatibility.className}`}>
                      {compatibility.text}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{request.distance} away</span>
                <span>{request.units} unit{request.units > 1 ? 's' : ''} needed</span>
              </div>
              <motion.button
                onClick={() => onShowRequestDetail(request)}
                disabled={compatibility && compatibility.status === 'incompatible'}
                className={`w-full mt-3 py-2 rounded-lg transition-all duration-200 ${
                  compatibility && compatibility.status === 'incompatible'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                }`}
                whileHover={compatibility && compatibility.status === 'incompatible' ? {} : { scale: 1.02 }}
                whileTap={compatibility && compatibility.status === 'incompatible' ? {} : { scale: 0.98 }}
              >
                {compatibility && compatibility.status === 'incompatible' ? 'Not Compatible' : 'View Details'}
              </motion.button>
            </motion.div>
          );
        }) : (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {!hasLocation ? 'No compatible blood requests found' : 'No nearby requests found'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {!hasLocation ? 'Check back later for new blood requests' : 'Check back later for new requests'}
            </p>
          </div>
        )}
      </div>
    </motion.div>

      {/* Donation History */}
      <motion.div 
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
      >
      <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
        <Calendar className="h-5 w-5 mr-2 text-green-600" />
        Donation History
      </h3>
      <div className="space-y-4">
        {stats?.recentDonations && stats.recentDonations.length > 0 ? (
          stats.recentDonations.map((donation, index) => (
            <motion.div
              key={donation._id}
              className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Donated {donation.bloodGroup} blood to {donation.requesterId?.name || 'Unknown'}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(donation.completedAt || donation.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="text-sm text-green-600 font-medium">Completed</span>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No donation history yet</p>
            <p className="text-sm text-gray-400 mt-2">Start donating to help save lives!</p>
          </div>
        )}
      </div>
      </motion.div>
    </div>
  </div>
);

const PatientTab = ({ myRequests, onUpdateRequestStatus, onCreateRequest, user, updatingRequest }) => {
  // Filter requests created by the user (patient requests)
  const createdRequests = (myRequests || []).filter(request => request?.requesterId?._id === user?._id);
  // For patient tab, we only show requests created by the user, not accepted requests
  
  return (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* My Requests */}
    <motion.div 
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-600" />
          My Requests
        </h3>
        <motion.button
          onClick={onCreateRequest}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">New Request</span>
        </motion.button>
      </div>
      <div className="space-y-4">
        {createdRequests.length > 0 ? createdRequests.map((request, index) => (
          <motion.div
            key={request._id}
            className="p-4 border border-gray-200 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900">{request.bloodGroup} Blood Request</p>
                <p className="text-sm text-gray-500">{request.hospitalName}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                request.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                request.status === 'on_the_way' ? 'bg-purple-100 text-purple-800' :
                request.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {request.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <span>{request.unitsNeeded} unit{request.unitsNeeded > 1 ? 's' : ''} needed</span>
              <span>Created {new Date(request.createdAt).toLocaleDateString()}</span>
            </div>
            {request.donorId && (
              <div className="text-sm text-gray-600 mb-3">
                <p>Donor: {request.donorId.name}</p>
                {request.acceptedAt && (
                  <p>Accepted: {new Date(request.acceptedAt).toLocaleDateString()}</p>
                )}
              </div>
            )}
            {request.status === 'accepted' && (
              <motion.button
                onClick={() => onUpdateRequestStatus(request._id, 'on_the_way')}
                disabled={updatingRequest === request._id}
                className={`w-full py-2 rounded-lg transition-all duration-200 ${
                  updatingRequest === request._id 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                } text-white`}
                whileHover={updatingRequest === request._id ? {} : { scale: 1.02 }}
                whileTap={updatingRequest === request._id ? {} : { scale: 0.98 }}
              >
                {updatingRequest === request._id ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  'Mark as On the Way'
                )}
              </motion.button>
            )}
            {request.status === 'on_the_way' && (
              <motion.button
                onClick={() => onUpdateRequestStatus(request._id, 'completed')}
                disabled={updatingRequest === request._id}
                className={`w-full py-2 rounded-lg transition-all duration-200 ${
                  updatingRequest === request._id 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                } text-white`}
                whileHover={updatingRequest === request._id ? {} : { scale: 1.02 }}
                whileTap={updatingRequest === request._id ? {} : { scale: 0.98 }}
              >
                {updatingRequest === request._id ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  'Mark as Completed'
                )}
              </motion.button>
            )}
          </motion.div>
        )) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No blood requests created yet</p>
            <p className="text-sm text-gray-400">Create your first blood request to get started!</p>
          </div>
        )}
      </div>
    </motion.div>

    {/* Request History */}
    <motion.div 
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 }}
    >
      <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
        <Clock className="h-5 w-5 mr-2 text-purple-600" />
        Request History
      </h3>
      <div className="space-y-4">
        {createdRequests.length > 0 ? createdRequests.map((request, index) => (
          <motion.div
            key={request._id}
            className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
          >
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              request.status === 'completed' ? 'bg-green-100' :
              request.status === 'on_the_way' ? 'bg-purple-100' :
              'bg-blue-100'
            }`}>
              {request.status === 'completed' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
               request.status === 'on_the_way' ? <Clock className="h-4 w-4 text-purple-600" /> :
               <Activity className="h-4 w-4 text-blue-600" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {request.donorId ? `Got ${request.bloodGroup} blood from ${request.donorId.name}` : `${request.bloodGroup} Blood Request`}
              </p>
              <p className="text-xs text-gray-500">
                {request.status === 'completed' ? `Completed ${new Date(request.completedAt).toLocaleDateString()}` :
                 request.status === 'on_the_way' ? `On the way to ${request.hospitalName}` :
                 `Requested for ${request.hospitalName}`}
              </p>
            </div>
            <span className={`text-sm font-medium ${
              request.status === 'completed' ? 'text-green-600' :
              request.status === 'on_the_way' ? 'text-purple-600' :
              'text-blue-600'
            }`}>
              {request.status === 'completed' ? 'Completed' :
               request.status === 'on_the_way' ? 'On the Way' :
               'Accepted'}
            </span>
          </motion.div>
        )) : (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No request history yet</p>
            <p className="text-sm text-gray-400">Create your first blood request to get started!</p>
          </div>
        )}
      </div>
    </motion.div>
  </div>
  );
};

const ActivityTab = ({ recentActivity }) => (
  <motion.div 
    className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.6 }}
  >
    <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
      <Activity className="h-5 w-5 mr-2 text-indigo-600" />
      Activity Timeline
    </h3>
    <div className="space-y-6">
      {recentActivity.map((activity, index) => (
        <motion.div
          key={activity.id}
          className="flex items-start space-x-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 + index * 0.1 }}
        >
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
            activity.type === 'donation' ? 'bg-red-100' :
            activity.type === 'request' ? 'bg-blue-100' :
            'bg-yellow-100'
          }`}>
            {activity.type === 'donation' ? <Heart className="h-5 w-5 text-red-600" /> :
             activity.type === 'request' ? <Users className="h-5 w-5 text-blue-600" /> :
             <Award className="h-5 w-5 text-yellow-600" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
            <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const AchievementsTab = ({ badges }) => {
  
  if (!badges || badges.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏆</div>
        <p className="text-gray-500 text-lg">No achievements available</p>
        <p className="text-gray-400 text-sm">Complete donations to earn badges!</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {badges.map((badge, index) => (
      <motion.div
        key={badge.name}
        className={`p-6 rounded-2xl border-2 ${
          badge.earned 
            ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' 
            : 'bg-gray-50 border-gray-200'
        }`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 + index * 0.1 }}
        whileHover={{ scale: 1.05 }}
      >
        <div className="text-center">
          <div className="text-4xl mb-3">{badge.icon}</div>
          <h3 className="font-semibold text-gray-900 mb-2">{badge.name}</h3>
          <p className="text-sm text-gray-600 mb-4">
            {badge.earned ? 'Earned!' : 'Not earned yet'}
          </p>
          {badge.earned && (
            <motion.div
              className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <Star className="h-3 w-3 mr-1" />
              Unlocked
            </motion.div>
          )}
        </div>
      </motion.div>
    ))}
  </div>
  );
};

// Request Detail Modal Component
const RequestDetailModal = ({ request, user, onClose, onAccept }) => {
  const compatibility = user?.bloodGroup ? getCompatibilityStatus(user.bloodGroup, request.bloodGroup) : null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Heart className="h-6 w-6 mr-2 text-red-600" />
              Blood Request Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Request Information */}
          <div className="space-y-6">
            {/* Blood Type and Urgency */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-red-100 p-3 rounded-xl">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{request.bloodGroup} Blood</h3>
                  <p className="text-sm text-gray-500">{request.hospital}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                request.urgency === 'critical' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {request.urgency}
              </span>
            </div>

            {/* Compatibility Status */}
            {compatibility && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Blood Compatibility:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${compatibility.className}`}>
                    {compatibility.text}
                  </span>
                </div>
                {compatibility.status === 'compatible' && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Your {user.bloodGroup} blood is compatible with {request.bloodGroup} blood
                  </p>
                )}
                {compatibility.status === 'incompatible' && (
                  <p className="text-sm text-red-600 mt-2">
                    ✗ Your {user.bloodGroup} blood is not compatible with {request.bloodGroup} blood
                  </p>
                )}
              </div>
            )}

            {/* Request Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="flex items-center mb-2">
                  <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">Distance</span>
                </div>
                <p className="text-lg font-semibold text-blue-900">{request.distance} away</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-xl">
                <div className="flex items-center mb-2">
                  <Activity className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">Units Needed</span>
                </div>
                <p className="text-lg font-semibold text-green-900">{request.units} unit{request.units > 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Additional Information</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Hospital:</strong> {request.hospital}</p>
                <p><strong>Blood Type:</strong> {request.bloodGroup}</p>
                <p><strong>Urgency:</strong> {request.urgency}</p>
                <p><strong>Distance:</strong> {request.distance}</p>
                <p><strong>Units Required:</strong> {request.units}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <motion.button
                onClick={onClose}
                className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              
              <motion.button
                onClick={() => onAccept(request.id)}
                disabled={compatibility && compatibility.status === 'incompatible'}
                className={`flex-1 py-3 px-6 rounded-lg transition-all duration-200 ${
                  compatibility && compatibility.status === 'incompatible'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                }`}
                whileHover={compatibility && compatibility.status === 'incompatible' ? {} : { scale: 1.02 }}
                whileTap={compatibility && compatibility.status === 'incompatible' ? {} : { scale: 0.98 }}
              >
                {compatibility && compatibility.status === 'incompatible' ? 'Not Compatible' : 'Accept Request'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardRouter;
