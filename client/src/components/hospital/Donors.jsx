import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Heart,
  CheckCircle,
  Clock,
  User,
  Eye,
  Plus,
  X
} from 'lucide-react';
import { getAcceptedDonors, addDirectDonor } from '../../services/hospitalService';
import toast from 'react-hot-toast';

const Donors = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('all');
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddDonorModal, setShowAddDonorModal] = useState(false);
  const [addingDonor, setAddingDonor] = useState(false);
  const [donorFormData, setDonorFormData] = useState({
    donorName: '',
    donorEmail: '',
    donorPhone: '',
    bloodGroup: ''
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const statusConfig = {
    accepted: { label: 'Accepted', color: 'text-blue-600 bg-blue-100', icon: Clock },
    confirmed: { label: 'Confirmed', color: 'text-purple-600 bg-purple-100', icon: CheckCircle },
    completed: { label: 'Completed', color: 'text-green-600 bg-green-100', icon: CheckCircle }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const data = await getAcceptedDonors();
      console.log('Fetched donors data:', data);
      console.log('Donors array:', data.data);
      setDonors(data.data || []);
    } catch (error) {
      console.error('Error fetching donors:', error);
      toast.error('Failed to load donors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDonor = async (e) => {
    e.preventDefault();
    
    if (!donorFormData.donorName || !donorFormData.donorEmail || !donorFormData.donorPhone || !donorFormData.bloodGroup) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setAddingDonor(true);
      await addDirectDonor(donorFormData);
      toast.success('Donor added successfully!');
      setShowAddDonorModal(false);
      setDonorFormData({
        donorName: '',
        donorEmail: '',
        donorPhone: '',
        bloodGroup: ''
      });
      fetchDonors(); // Refresh the donors list
    } catch (error) {
      console.error('Error adding donor:', error);
      toast.error('Failed to add donor');
    } finally {
      setAddingDonor(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDonorFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donor.phone.includes(searchTerm);
    
    // For status filter, check if donor has any donations with that status
    const matchesStatus = statusFilter === 'all' || 
                         donor.donations.some(donation => donation.status === statusFilter);
    
    const matchesBloodGroup = bloodGroupFilter === 'all' || donor.bloodGroup === bloodGroupFilter;
    
    return matchesSearch && matchesStatus && matchesBloodGroup;
  });

  const getStatusIcon = (status) => {
    const Icon = statusConfig[status]?.icon || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const handleViewDetails = (donor) => {
    setSelectedDonor(donor);
    setShowDetailsModal(true);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blood Donors</h1>
          <p className="text-gray-600 mt-1">View all donors who have donated blood to your hospital</p>
        </div>
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddDonorModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Donor</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchDonors}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Users className="h-5 w-5" />
            <span>Refresh</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Donors</p>
              <p className="text-3xl font-bold text-gray-900">{donors.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Donations</p>
              <p className="text-3xl font-bold text-gray-900">
                {donors.reduce((total, donor) => total + donor.totalDonations, 0)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <Heart className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-gray-900">
                {donors.filter(d => d.donations.some(donation => donation.status === 'completed')).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search donors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* Blood Group Filter */}
          <select
            value={bloodGroupFilter}
            onChange={(e) => setBloodGroupFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Blood Groups</option>
            {bloodGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Donors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDonors.map((donor, index) => {
          const latestDonation = donor.donations[0]; // Most recent donation
          const completedDonations = donor.donations.filter(d => d.status === 'completed').length;
          
          return (
            <motion.div
              key={donor._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{donor.name}</h3>
                    <p className="text-sm text-gray-500">{donor.bloodGroup}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-red-600">{donor.totalDonations}</div>
                  <div className="text-xs text-gray-500">donations</div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{donor.phone}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{donor.email}</span>
                </div>
              </div>

              {latestDonation && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-gray-500">Latest Patient</p>
                      <p className="font-medium text-gray-900">{latestDonation.patientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        latestDonation.status === 'completed' ? 'text-green-600 bg-green-100' :
                        latestDonation.status === 'confirmed' ? 'text-purple-600 bg-purple-100' :
                        'text-blue-600 bg-blue-100'
                      }`}>
                        {latestDonation.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-green-600">{completedDonations}</span> completed
                </div>
                <button
                  onClick={() => handleViewDetails(donor)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredDonors.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No donors found</h3>
          <p className="text-gray-500">
            {donors.length === 0 
              ? "No donors have donated blood to your hospital yet."
              : "Try adjusting your search or filter criteria."
            }
          </p>
        </motion.div>
      )}

      {/* Donor Details Modal */}
      {showDetailsModal && selectedDonor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Donor Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Donor Info */}
              <div className="space-y-6">
                {/* Donor Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                    <User className="h-10 w-10 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-semibold text-gray-900">{selectedDonor.name}</h4>
                    <p className="text-lg text-gray-600">{selectedDonor.bloodGroup}</p>
                    <div className="mt-2 flex items-center space-x-4">
                      <span className="text-sm font-medium text-red-600">
                        {selectedDonor.totalDonations} total donations
                      </span>
                      <span className="text-sm text-gray-500">
                        {selectedDonor.donations.filter(d => d.status === 'completed').length} completed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-900 text-lg">Contact Information</h5>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{selectedDonor.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{selectedDonor.email}</span>
                    </div>
                  </div>
                </div>

                {/* Donation Statistics */}
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-900 text-lg">Donation Statistics</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedDonor.donations.filter(d => d.status === 'completed').length}
                      </div>
                      <div className="text-sm text-green-700">Completed</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedDonor.donations.filter(d => d.status === 'accepted').length}
                      </div>
                      <div className="text-sm text-blue-700">Accepted</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Donation History */}
              <div className="space-y-6">
                <h5 className="font-medium text-gray-900 text-lg">Donation History</h5>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedDonor.donations.map((donation, index) => (
                    <div key={donation.requestId} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{donation.patientName}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          donation.status === 'completed' ? 'text-green-600 bg-green-100' :
                          donation.status === 'confirmed' ? 'text-purple-600 bg-purple-100' :
                          'text-blue-600 bg-blue-100'
                        }`}>
                          {donation.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Blood Group: {donation.bloodGroup}</div>
                        <div>Urgency: {donation.urgency}</div>
                        <div>Date: {new Date(donation.createdAt).toLocaleDateString()}</div>
                        {donation.completedAt && (
                          <div>Completed: {new Date(donation.completedAt).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (selectedDonor.phone) {
                    // Clean phone number and add +91 country code if not present
                    let phoneNumber = selectedDonor.phone.replace(/\D/g, ''); // Remove non-digits
                    
                    // Add +91 country code if not already present
                    if (!phoneNumber.startsWith('91') && !phoneNumber.startsWith('+91')) {
                      phoneNumber = '91' + phoneNumber;
                    }
                    
                    const whatsappUrl = `https://wa.me/${phoneNumber}`;
                    const telUrl = `tel:+${phoneNumber}`;
                    
                    // Try WhatsApp first, fallback to phone
                    window.open(whatsappUrl, '_blank');
                    // Also provide tel: link as backup
                    setTimeout(() => {
                      window.location.href = telUrl;
                    }, 1000);
                  } else {
                    toast.error('No phone number available for this donor');
                  }
                }}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Contact Donor
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Add Donor Modal */}
      {showAddDonorModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Direct Donor</h3>
            
            <form onSubmit={handleAddDonor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Donor Name *
                </label>
                <input
                  type="text"
                  name="donorName"
                  value={donorFormData.donorName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter donor's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="donorEmail"
                  value={donorFormData.donorEmail}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter donor's email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="donorPhone"
                  value={donorFormData.donorPhone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter donor's phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Group *
                </label>
                <select
                  name="bloodGroup"
                  value={donorFormData.bloodGroup}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddDonorModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingDonor}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {addingDonor ? 'Adding...' : 'Add Donor'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Donors;