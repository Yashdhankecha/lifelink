import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Search, 
  Filter, 
  Eye,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Building2,
  X
} from 'lucide-react';
import { getAllRequests, updateRequestStatus } from '../../services/adminService';
import toast from 'react-hot-toast';

const Requests = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    urgency: '',
    bloodGroup: ''
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await getAllRequests(filters);
      if (response.success) {
        setRequests(response.data.requests);
        setPagination(response.data.pagination);
      } else {
        toast.error('Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      setActionLoading(requestId);
      const response = await updateRequestStatus(requestId, { status: newStatus });
      if (response.success) {
        toast.success('Request status updated successfully');
        fetchRequests();
      } else {
        toast.error('Failed to update request status');
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('Failed to update request status');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      accepted: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      on_the_way: { color: 'bg-purple-100 text-purple-800', icon: User },
      confirmed: { color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getUrgencyBadge = (urgency) => {
    const urgencyConfig = {
      critical: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      normal: { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };

    const config = urgencyConfig[urgency] || urgencyConfig.normal;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {urgency.toUpperCase()}
      </span>
    );
  };

  const getBloodGroupBadge = (bloodGroup) => {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        {bloodGroup}
      </span>
    );
  };

  const getStatusActions = (request) => {
    const statusActions = {
      pending: [
        { label: 'Accept', status: 'accepted', color: 'text-green-600 hover:text-green-900 hover:bg-green-100' },
        { label: 'Cancel', status: 'cancelled', color: 'text-red-600 hover:text-red-900 hover:bg-red-100' }
      ],
      accepted: [
        { label: 'On Way', status: 'on_the_way', color: 'text-blue-600 hover:text-blue-900 hover:bg-blue-100' },
        { label: 'Cancel', status: 'cancelled', color: 'text-red-600 hover:text-red-900 hover:bg-red-100' }
      ],
      on_the_way: [
        { label: 'Confirm', status: 'confirmed', color: 'text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100' },
        { label: 'Cancel', status: 'cancelled', color: 'text-red-600 hover:text-red-900 hover:bg-red-100' }
      ],
      confirmed: [
        { label: 'Complete', status: 'completed', color: 'text-green-600 hover:text-green-900 hover:bg-green-100' },
        { label: 'Cancel', status: 'cancelled', color: 'text-red-600 hover:text-red-900 hover:bg-red-100' }
      ]
    };

    const actions = statusActions[request.status] || [];
    
    return (
      <div className="flex items-center space-x-1">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleStatusUpdate(request._id, action.status)}
            disabled={actionLoading === request._id}
            className={`p-1 rounded text-xs font-medium ${action.color} disabled:opacity-50`}
          >
            {actionLoading === request._id ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              action.label
            )}
          </button>
        ))}
      </div>
    );
  };

  if (loading && requests.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-200 mx-auto mb-4"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            <Heart className="h-6 w-6 text-red-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-heartbeat" />
          </div>
          <p className="text-gray-600 text-lg font-medium animate-pulse-slow">Loading requests<span className="loading-dots"></span></p>
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
              <h1 className="text-3xl font-bold text-gray-900">Blood Requests Management</h1>
              <p className="text-gray-600 mt-1">Monitor and manage all blood requests</p>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-md flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'pending').length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Accepted</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'accepted').length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">On Way</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'on_the_way').length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-md flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'completed').length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-red-600 rounded-md flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Cancelled</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'cancelled').length}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="on_the_way">On Way</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                <select
                  value={filters.urgency}
                  onChange={(e) => handleFilterChange('urgency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">All Urgency</option>
                  <option value="critical">Critical</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                <select
                  value={filters.bloodGroup}
                  onChange={(e) => handleFilterChange('bloodGroup', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">All Blood Groups</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Per Page</label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Requests Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request, index) => (
                    <motion.tr
                      key={request._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            {getBloodGroupBadge(request.bloodGroup)}
                            <span className="text-sm font-medium text-gray-900">
                              {request.unitsNeeded} unit{request.unitsNeeded > 1 ? 's' : ''}
                            </span>
                          </div>
                          {request.notes && (
                            <p className="text-xs text-gray-500 truncate max-w-xs">{request.notes}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{request.hospitalName}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{request.hospitalAddress}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getUrgencyBadge(request.urgency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRequestModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {getStatusActions(request)}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(pagination.currentPage - 1) * pagination.limit + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.currentPage * pagination.limit, pagination.totalRequests)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{pagination.totalRequests}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      {[...Array(pagination.totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => handlePageChange(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.currentPage === i + 1
                              ? 'z-10 bg-red-50 border-red-500 text-red-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Request Details Modal */}
      {showRequestModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setSelectedRequest(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Request Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                      <Heart className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Blood Request #{selectedRequest._id.slice(-8)}
                      </h3>
                      <p className="text-gray-600">
                        {selectedRequest.bloodGroup} • {selectedRequest.unitsNeeded} unit{selectedRequest.unitsNeeded > 1 ? 's' : ''}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        {getStatusBadge(selectedRequest.status)}
                        {getUrgencyBadge(selectedRequest.urgency)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Request Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Blood Request Details */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Blood Request Details</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Blood Group Required</label>
                        <p className="text-gray-900">{selectedRequest.bloodGroup}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Units Needed</label>
                        <p className="text-gray-900">{selectedRequest.unitsNeeded} unit{selectedRequest.unitsNeeded > 1 ? 's' : ''}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Urgency Level</label>
                        <div className="mt-1">
                          {getUrgencyBadge(selectedRequest.urgency)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Request Status</label>
                        <div className="mt-1">
                          {getStatusBadge(selectedRequest.status)}
                        </div>
                      </div>
                      {selectedRequest.notes && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Notes</label>
                          <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequest.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hospital Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Hospital Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Hospital Name</label>
                        <p className="text-gray-900">{selectedRequest.hospitalName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Hospital Address</label>
                        <p className="text-gray-900">{selectedRequest.hospitalAddress}</p>
                      </div>
                      {selectedRequest.location && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Location</label>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <p className="text-gray-900">
                              {selectedRequest.location.latitude}, {selectedRequest.location.longitude}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline and Status */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Request Timeline</h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Request Created</p>
                        <p className="text-sm text-gray-500">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {selectedRequest.updatedAt && selectedRequest.updatedAt !== selectedRequest.createdAt && (
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Clock className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Last Updated</p>
                          <p className="text-sm text-gray-500">{new Date(selectedRequest.updatedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    )}

                    {selectedRequest.donorId && (
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-purple-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Donor Assigned</p>
                          <p className="text-sm text-gray-500">
                            {typeof selectedRequest.donorId === 'object' 
                              ? `Donor: ${selectedRequest.donorId.name || 'Unknown'} (${selectedRequest.donorId._id})`
                              : `Donor ID: ${selectedRequest.donorId}`
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                {selectedRequest.requesterId && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Requester Information</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">
                        {typeof selectedRequest.requesterId === 'object' ? (
                          <>
                            Requester: <span className="font-medium">{selectedRequest.requesterId.name || 'Unknown'}</span>
                            <br />
                            Email: <span className="font-mono">{selectedRequest.requesterId.email || 'N/A'}</span>
                            <br />
                            Phone: <span className="font-mono">{selectedRequest.requesterId.phone || 'N/A'}</span>
                            <br />
                            ID: <span className="font-mono text-xs">{selectedRequest.requesterId._id}</span>
                          </>
                        ) : (
                          <>Requester ID: <span className="font-mono">{selectedRequest.requesterId}</span></>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  {getStatusActions(selectedRequest)}
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      setShowRequestModal(false);
                      setSelectedRequest(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Requests;