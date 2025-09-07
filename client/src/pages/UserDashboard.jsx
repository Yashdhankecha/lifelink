import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Heart, MapPin, Calendar, Users, Activity } from 'lucide-react';
import LocationUpdate from '../components/LocationUpdate';
import Chatbot from '../components/Chatbot';
import { getProfile, getDonationStats } from '../services/userService';
import { getMyRequests } from '../services/requestService';

const UserDashboard = () => {
  const { user } = useAuth();
  const [showLocationUpdate, setShowLocationUpdate] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const profileResponse = await getProfile();
      setUserProfile(profileResponse.data.user);
      
      // Fetch donation stats
      const statsResponse = await getDonationStats();
      setStats(statsResponse.data.data);
      
      // Fetch my requests
      const requestsResponse = await getMyRequests();
      setMyRequests(requestsResponse.data.data);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };


  const userStats = [
    { label: 'Blood Group', value: userProfile?.bloodGroup || 'N/A', icon: <Heart className="h-5 w-5" /> },
    { label: 'Availability', value: userProfile?.availability ? 'Available' : 'Not Available', icon: <Activity className="h-5 w-5" /> },
    { label: 'Total Donations', value: stats?.totalDonations || 0, icon: <Calendar className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your blood donation activities and help save lives
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {userStats.map((stat, index) => (
            <div key={index} className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary-100 text-primary-600">
                    {stat.icon}
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>


        {/* Location Update Modal */}
        {showLocationUpdate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Update Location</h3>
                  <button
                    onClick={() => setShowLocationUpdate(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <LocationUpdate 
                  onLocationUpdate={() => setShowLocationUpdate(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Requests */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Blood Requests</h3>
            <div className="space-y-4">
              {myRequests.filter(req => req.requesterId._id === user?._id).length > 0 ? (
                myRequests.filter(req => req.requesterId._id === user?._id).slice(0, 3).map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{request.bloodGroup} Blood Request</p>
                      <p className="text-sm text-gray-600">{request.hospitalName}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      request.urgency === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.urgency === 'critical' ? 'Critical' : 'Normal'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No blood requests yet</p>
                  <p className="text-sm text-gray-400">Create your first blood request!</p>
                </div>
              )}
            </div>
          </div>

          {/* Request History */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request History</h3>
            <div className="space-y-4">
              {myRequests.filter(req => req.requesterId._id === user?._id).length > 0 ? (
                myRequests.filter(req => req.requesterId._id === user?._id).slice(0, 3).map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{request.bloodGroup} Blood Request</p>
                      <p className="text-sm text-gray-600">{request.hospitalName}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      request.status === 'completed' ? 'bg-green-100 text-green-800' :
                      request.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                      request.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status === 'completed' ? 'Completed' :
                       request.status === 'confirmed' ? 'Confirmed' :
                       request.status === 'accepted' ? 'Accepted' :
                       'Pending'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No request history yet</p>
                  <p className="text-sm text-gray-400">Create your first blood request!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Chatbot Component */}
      <Chatbot />
    </div>
  );
};

export default UserDashboard;
