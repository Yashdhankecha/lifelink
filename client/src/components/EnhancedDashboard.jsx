import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  Heart, 
  MapPin, 
  Calendar, 
  Users, 
  Activity, 
  Award, 
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  BarChart3,
  Target,
  Zap,
  Shield,
  Star,
  MessageCircle,
  Share2,
  Download,
  Filter,
  Search,
  Settings,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';

const EnhancedDashboard = () => {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    badges: [],
    streak: 0,
    impact: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Simulate API calls with placeholder data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalDonations: 12,
        totalRequests: 8,
        activeRequests: 3,
        completedRequests: 5,
        badges: [
          { name: 'First Donation', icon: '🎯', earned: true },
          { name: 'Life Saver', icon: '🩸', earned: true },
          { name: 'Regular Donor', icon: '⭐', earned: true },
          { name: 'Community Hero', icon: '🏆', earned: false }
        ],
        streak: 3,
        impact: 24
      });

      setRecentActivity([
        { id: 1, type: 'donation', message: 'Donated blood to City Hospital', time: '2 hours ago', status: 'completed' },
        { id: 2, type: 'request', message: 'New blood request from General Hospital', time: '4 hours ago', status: 'pending' },
        { id: 3, type: 'badge', message: 'Earned "Life Saver" badge', time: '1 day ago', status: 'earned' },
        { id: 4, type: 'donation', message: 'Donated blood to Emergency Center', time: '3 days ago', status: 'completed' }
      ]);

      setNearbyRequests([
        { id: 1, bloodGroup: 'O+', hospital: 'City Hospital', urgency: 'critical', distance: '2.3 km', units: 2 },
        { id: 2, bloodGroup: 'A+', hospital: 'General Hospital', urgency: 'normal', distance: '5.1 km', units: 1 },
        { id: 3, bloodGroup: 'B+', hospital: 'Emergency Center', urgency: 'critical', distance: '3.7 km', units: 3 }
      ]);

      setNotifications([
        { id: 1, message: 'Your donation helped save a life!', time: '1 hour ago', read: false },
        { id: 2, message: 'New badge earned: Community Hero', time: '2 hours ago', read: false },
        { id: 3, message: 'Reminder: You can donate again in 2 days', time: '1 day ago', read: true }
      ]);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
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
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
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
              bgColor: 'from-red-100 to-red-200',
              change: '+12%'
            },
            { 
              label: 'Active Requests', 
              value: stats.activeRequests, 
              icon: Activity, 
              color: 'from-blue-500 to-blue-600',
              bgColor: 'from-blue-100 to-blue-200',
              change: '+3'
            },
            { 
              label: 'Impact Score', 
              value: stats.impact, 
              icon: Target, 
              color: 'from-green-500 to-green-600',
              bgColor: 'from-green-100 to-green-200',
              change: '+5'
            },
            { 
              label: 'Current Streak', 
              value: `${stats.streak} days`, 
              icon: Zap, 
              color: 'from-purple-500 to-purple-600',
              bgColor: 'from-purple-100 to-purple-200',
              change: 'Keep it up!'
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
                <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
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
            {activeTab === 'overview' && (
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
                      <Bell className="h-5 w-5 mr-2 text-purple-600" />
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

                  {/* Quick Actions */}
                  <motion.div 
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                      <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                      Quick Actions
                    </h3>
                    <div className="space-y-3">
                      <motion.button
                        className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Heart className="h-4 w-4" />
                        <span className="text-sm font-medium">Find Donation Requests</span>
                      </motion.button>
                      <motion.button
                        className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="text-sm font-medium">Create Blood Request</span>
                      </motion.button>
                      <motion.button
                        className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Share Your Impact</span>
                      </motion.button>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {activeTab === 'donor' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Nearby Requests */}
                <motion.div 
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-red-600" />
                      Nearby Requests
                    </h3>
                    <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                      View All
                    </button>
                  </div>
                  <div className="space-y-4">
                    {nearbyRequests.map((request, index) => (
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
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.urgency === 'critical' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {request.urgency}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{request.distance} away</span>
                          <span>{request.units} unit{request.units > 1 ? 's' : ''} needed</span>
                        </div>
                        <motion.button
                          className="w-full mt-3 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Accept Request
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Donation History */}
                <motion.div 
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                    <Calendar className="h-5 w-5 mr-2 text-green-600" />
                    Donation History
                  </h3>
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((item, index) => (
                      <motion.div
                        key={item}
                        className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                      >
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Donated to City Hospital</p>
                          <p className="text-xs text-gray-500">2 days ago</p>
                        </div>
                        <span className="text-sm text-green-600 font-medium">Completed</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === 'patient' && (
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
                      className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm font-medium">New Request</span>
                    </motion.button>
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((item, index) => (
                      <motion.div
                        key={item}
                        className="p-4 border border-gray-200 rounded-xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-gray-900">O+ Blood Request</p>
                            <p className="text-sm text-gray-500">General Hospital</p>
                          </div>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            Pending
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>2 units needed</span>
                          <span>Created 1 day ago</span>
                        </div>
                      </motion.div>
                    ))}
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
                    {[1, 2, 3, 4].map((item, index) => (
                      <motion.div
                        key={item}
                        className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                      >
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">A+ Blood Request</p>
                          <p className="text-xs text-gray-500">Completed 3 days ago</p>
                        </div>
                        <span className="text-sm text-green-600 font-medium">Fulfilled</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === 'activity' && (
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
            )}

            {activeTab === 'achievements' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.badges.map((badge, index) => (
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
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
