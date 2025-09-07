import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Search, 
  Filter, 
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';
import { getAllUsers, updateUserStatus } from '../../services/adminService';
import toast from 'react-hot-toast';

const Hospitals = () => {
  const [loading, setLoading] = useState(true);
  const [hospitals, setHospitals] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: ''
  });
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const response = await getAllUsers({ ...filters, role: 'hospital' });
      if (response.success) {
        setHospitals(response.data.users);
        setPagination(response.data.pagination);
      } else {
        toast.error('Failed to fetch hospitals');
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
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

  const handleApproval = async (hospitalId, approved) => {
    try {
      setActionLoading(hospitalId);
      const response = await updateUserStatus(hospitalId, { 
        isVerified: approved,
        isActive: approved 
      });
      if (response.success) {
        toast.success(`Hospital ${approved ? 'approved' : 'rejected'} successfully`);
        fetchHospitals();
      } else {
        toast.error(`Failed to ${approved ? 'approve' : 'reject'} hospital`);
      }
    } catch (error) {
      console.error('Error updating hospital status:', error);
      toast.error(`Failed to ${approved ? 'approve' : 'reject'} hospital`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (hospital) => {
    if (!hospital.isActive) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactive</span>;
    }
    if (!hospital.isVerified) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending Approval</span>;
    }
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
  };

  const getApprovalActions = (hospital) => {
    if (hospital.isVerified) {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-green-600 text-sm font-medium">Approved</span>
          <button
            onClick={() => handleApproval(hospital._id, false)}
            disabled={actionLoading === hospital._id}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100 disabled:opacity-50"
          >
            {actionLoading === hospital._id ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleApproval(hospital._id, true)}
          disabled={actionLoading === hospital._id}
          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-100 disabled:opacity-50"
        >
          {actionLoading === hospital._id ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => handleApproval(hospital._id, false)}
          disabled={actionLoading === hospital._id}
          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100 disabled:opacity-50"
        >
          {actionLoading === hospital._id ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  };

  if (loading && hospitals.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-200 mx-auto mb-4"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            <Building2 className="h-6 w-6 text-red-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-heartbeat" />
          </div>
          <p className="text-gray-600 text-lg font-medium animate-pulse-slow">Loading hospitals<span className="loading-dots"></span></p>
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
              <h1 className="text-3xl font-bold text-gray-900">Hospital Management</h1>
              <p className="text-gray-600 mt-1">Manage hospital registrations and approvals</p>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Hospitals</p>
                  <p className="text-2xl font-bold text-gray-900">{pagination.totalUsers || 0}</p>
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
                  <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-md flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {hospitals.filter(h => h.isVerified).length}
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
                  <div className="h-10 w-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-md flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {hospitals.filter(h => !h.isVerified).length}
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
                  <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-red-600 rounded-md flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {hospitals.filter(h => !h.isActive).length}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search hospitals..."
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
                  <option value="verified">Approved</option>
                  <option value="unverified">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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

          {/* Hospitals Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hospitals.map((hospital, index) => (
                    <motion.tr
                      key={hospital._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {hospital.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{hospital.name}</div>
                            <div className="text-sm text-gray-500">{hospital.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {hospital.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {hospital.phone}
                            </div>
                          )}
                          {hospital.address && (
                            <div className="flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-xs">{hospital.address}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(hospital)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(hospital.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedHospital(hospital);
                              setShowHospitalModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {getApprovalActions(hospital)}
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
                        {Math.min(pagination.currentPage * pagination.limit, pagination.totalUsers)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{pagination.totalUsers}</span>
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

      {/* Hospital Details Modal */}
      {showHospitalModal && selectedHospital && (
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
                  <Building2 className="h-6 w-6 mr-2 text-blue-600" />
                  Hospital Details
                </h2>
                <button
                  onClick={() => {
                    setShowHospitalModal(false);
                    setSelectedHospital(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Hospital Information */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Hospital Name</h3>
                    <p className="text-lg font-semibold text-gray-900">{selectedHospital.hospitalName || selectedHospital.name}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Contact Person</h3>
                    <p className="text-lg font-semibold text-gray-900">{selectedHospital.name}</p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <div className="flex items-center mb-2">
                      <Mail className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="text-sm font-medium text-blue-800">Email</h3>
                    </div>
                    <p className="text-lg font-semibold text-blue-900">{selectedHospital.email}</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-xl">
                    <div className="flex items-center mb-2">
                      <Phone className="h-5 w-5 text-green-600 mr-2" />
                      <h3 className="text-sm font-medium text-green-800">Phone</h3>
                    </div>
                    <p className="text-lg font-semibold text-green-900">{selectedHospital.phone || selectedHospital.contactNumber || 'Not provided'}</p>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-purple-50 p-4 rounded-xl">
                  <div className="flex items-center mb-2">
                    <MapPin className="h-5 w-5 text-purple-600 mr-2" />
                    <h3 className="text-sm font-medium text-purple-800">Address</h3>
                  </div>
                  <p className="text-lg font-semibold text-purple-900">{selectedHospital.address || 'Not provided'}</p>
                </div>

                {/* License Information */}
                {selectedHospital.licenseNumber && (
                  <div className="bg-yellow-50 p-4 rounded-xl">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">License Number</h3>
                    <p className="text-lg font-semibold text-yellow-900">{selectedHospital.licenseNumber}</p>
                  </div>
                )}

                {/* Status Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Verification Status</h3>
                    {getStatusBadge(selectedHospital)}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center mb-2">
                      <Calendar className="h-5 w-5 text-gray-600 mr-2" />
                      <h3 className="text-sm font-medium text-gray-700">Registered</h3>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(selectedHospital.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <motion.button
                    onClick={() => {
                      setShowHospitalModal(false);
                      setSelectedHospital(null);
                    }}
                    className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Close
                  </motion.button>
                  
                  {!selectedHospital.isVerified && (
                    <motion.button
                      onClick={() => {
                        handleApproval(selectedHospital._id, true);
                        setShowHospitalModal(false);
                        setSelectedHospital(null);
                      }}
                      className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Approve Hospital
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Hospitals;