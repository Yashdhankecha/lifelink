import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Building2,
  Heart,
  Clock,
  AlertTriangle,
  Activity,
  MapPin
} from 'lucide-react';
import { getDashboardAnalytics } from '../../services/adminService';
import toast from 'react-hot-toast';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalUsers: 0,
      totalDonors: 0,
      totalHospitals: 0,
      totalRequests: 0
    },
    requestStats: {},
    bloodGroupStats: [],
    recentActivity: [],
    urgentRequests: [],
    topHospitals: [],
    geographicStats: [],
    monthlyTrends: []
  });

  // Transform monthly trends data for chart with fallback
  const getRequestTrendData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (!dashboardData.monthlyTrends || dashboardData.monthlyTrends.length === 0) {
      // Fallback data for the last 6 months when no data is available
      const currentDate = new Date();
      return Array.from({ length: 6 }, (_, index) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - index), 1);
        return {
          month: monthNames[date.getMonth()],
          requests: 0,
          completed: 0
        };
      });
    }
    
    return dashboardData.monthlyTrends.map(trend => ({
      month: monthNames[trend._id.month - 1],
      requests: trend.totalRequests,
      completed: trend.completedRequests
    }));
  };
  
  const requestTrendData = getRequestTrendData();

  // Transform blood group data for chart with accurate percentages
  const getBloodGroupData = () => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'];
    const allBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    
    if (!dashboardData.bloodGroupStats || dashboardData.bloodGroupStats.length === 0) {
      // Fallback data showing all blood groups with 0 counts
      return allBloodGroups.map((group, index) => ({
        name: group,
        value: 0,
        count: 0,
        percentage: 0,
        color: colors[index % colors.length]
      }));
    }
    
    // Calculate total donors
    const totalDonors = dashboardData.bloodGroupStats.reduce((sum, item) => sum + item.count, 0);
    
    // Create a map of existing data
    const existingData = dashboardData.bloodGroupStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    
    // Calculate percentages ensuring they add up to 100%
    const bloodGroupData = allBloodGroups.map((group, index) => {
      const count = existingData[group] || 0;
      return {
        name: group,
        count: count,
        color: colors[index % colors.length]
      };
    });
    
    // Calculate raw percentages
    const rawPercentages = bloodGroupData.map(item => ({
      ...item,
      rawPercentage: totalDonors > 0 ? (item.count / totalDonors) * 100 : 0
    }));
    
    // Adjust percentages to ensure they sum to 100%
    const totalRawPercentage = rawPercentages.reduce((sum, item) => sum + item.rawPercentage, 0);
    const adjustment = 100 - totalRawPercentage;
    
    // Find the largest group to adjust (to minimize visual impact)
    const largestGroupIndex = rawPercentages.reduce((maxIndex, item, index) => 
      item.count > rawPercentages[maxIndex].count ? index : maxIndex, 0
    );
    
    // Apply adjustment to ensure 100% total
    const adjustedPercentages = rawPercentages.map((item, index) => {
      let percentage = item.rawPercentage;
      
      // Add the adjustment to the largest group
      if (index === largestGroupIndex && adjustment !== 0) {
        percentage += adjustment;
      }
      
      // Round to 1 decimal place
      percentage = Math.round(percentage * 10) / 10;
      
      return {
        name: item.name,
        value: item.count, // For chart display
        count: item.count, // For legend display
        percentage: percentage, // For percentage display
        color: item.color
      };
    });
    
    // Filter out groups with 0 count to prevent tiny segments that cause overlapping
    const filteredPercentages = adjustedPercentages.filter(item => item.count > 0);
    
    // If no data, return all groups with 0 for fallback
    if (filteredPercentages.length === 0) {
      return adjustedPercentages;
    }
    
    return filteredPercentages;
  };
  
  const bloodGroupData = getBloodGroupData();

  // Transform request stats for urgency display
  const urgencyData = [
    { name: 'Pending', value: dashboardData.requestStats.pending || 0, color: '#f97316' },
    { name: 'Accepted', value: dashboardData.requestStats.accepted || 0, color: '#3b82f6' },
    { name: 'Completed', value: dashboardData.requestStats.completed || 0, color: '#22c55e' },
    { name: 'Cancelled', value: dashboardData.requestStats.cancelled || 0, color: '#ef4444' }
  ];

  // Transform urgent requests for recent activity with fallback
  const getRecentActivity = () => {
    if (!dashboardData.urgentRequests || dashboardData.urgentRequests.length === 0) {
      // Fallback message when no urgent requests
      return [{
        id: 'no-activity',
        type: 'info',
        message: 'No urgent requests at the moment. All systems running smoothly.',
        time: new Date().toLocaleString(),
        urgent: false
      }];
    }
    
    return dashboardData.urgentRequests.map((request, index) => ({
      id: request._id,
      type: 'request',
      message: `Urgent ${request.bloodGroup} blood request from ${request.hospitalName}`,
      time: new Date(request.createdAt).toLocaleString(),
      urgent: request.urgency === 'critical'
    }));
  };
  
  const recentActivity = getRecentActivity();

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await getDashboardAnalytics();
      if (response.success) {
        setDashboardData(response.data);
      } else {
        toast.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: dashboardData.overview.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Total Donors',
      value: dashboardData.overview.totalDonors,
      icon: Heart,
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'Total Hospitals',
      value: dashboardData.overview.totalHospitals,
      icon: Building2,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Total Requests',
      value: dashboardData.overview.totalRequests,
      icon: Activity,
      color: 'from-green-500 to-green-600'
    }
  ];


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
        <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your platform.</p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${0.4 + index * 0.1}s` }}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`h-10 w-10 bg-gradient-to-br ${stat.color.replace('from-', 'from-').replace('to-', 'to-')} rounded-md flex items-center justify-center animate-bounce-slow`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                            <motion.p
                            className="text-2xl font-bold text-gray-900"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.5, type: "spring", stiffness: 200 }}
                          >
                            {stat.value.toLocaleString()}
                          </motion.p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Trend Chart */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Request Trends</h3>
            <Badge variant="info">Last 6 months</Badge>
          </div>
                            <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={requestTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" stroke="#666" />
                        <YAxis stroke="#666" domain={[0, 'dataMax + 5']} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="requests"
                          stroke="#ef4444"
                          strokeWidth={3}
                          dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="completed"
                          stroke="#22c55e"
                          strokeWidth={3}
                          dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
        </Card>

        {/* Blood Group Distribution */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Blood Group Distribution</h3>
              <p className="text-sm text-gray-500 mt-1">
                Total Donors: {bloodGroupData.reduce((sum, item) => sum + item.count, 0)} 
                • Total: {bloodGroupData.reduce((sum, item) => sum + item.percentage, 0)}%
              </p>
            </div>
            <Badge variant="info">Donor Pool</Badge>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bloodGroupData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                  minAngle={1}
                >
                  {bloodGroupData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke="#ffffff"
                      strokeWidth={3}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value, name, props) => [
                    `${value} donors (${props.payload.percentage}%)`,
                    'Count'
                  ]}
                  labelFormatter={(label) => `Blood Group: ${label}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {bloodGroupData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  <span className="text-xs text-gray-500 ml-1">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgency Levels */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Request Status</h3>
          <div className="space-y-4">
            {urgencyData.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / 50) * 100}%` }}
                      transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></motion.div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{item.value}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Badge variant="info">Live Updates</Badge>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${
                  activity.urgent ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {activity.urgent ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : (
                    <Activity className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
                {activity.urgent && (
                  <Badge variant="danger" size="sm">Urgent</Badge>
                )}
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

