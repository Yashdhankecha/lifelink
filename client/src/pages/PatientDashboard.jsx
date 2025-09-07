import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { 
  createBloodRequest, 
  getMyRequests, 
  updateRequestStatus,
  getStatusColor,
  getUrgencyColor,
  formatDate
} from '../services/requestService';
import { getRegisteredHospitals } from '../services/userService';
import { 
  Heart, 
  MapPin, 
  Calendar, 
  Users, 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  Phone,
  Building,
  Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

const PatientDashboard = () => {
  const { user } = useAuth();
  const { latitude, longitude, error: locationError } = useGeolocation();
  
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);

  const [formData, setFormData] = useState({
    bloodGroup: '',
    unitsNeeded: 1,
    urgency: 'normal',
    selectedHospitalId: '',
    hospitalName: '',
    hospitalAddress: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchMyRequests();
    }
  }, [user]);

  // Fetch registered hospitals
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setHospitalsLoading(true);
        const response = await getRegisteredHospitals();
        setHospitals(response.data.data || []);
      } catch (error) {
        console.error('Error fetching hospitals:', error);
      } finally {
        setHospitalsLoading(false);
      }
    };

    if (showCreateForm) {
      fetchHospitals();
    }
  }, [showCreateForm]);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const response = await getMyRequests(null, 'created');
      setMyRequests(response.data.data || []);
    } catch (error) {
      console.log('No requests found or error fetching:', error);
      setMyRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHospitalChange = (e) => {
    const selectedHospitalId = e.target.value;
    const selectedHospital = hospitals.find(h => h._id === selectedHospitalId);
    
    setFormData(prev => ({
      ...prev,
      selectedHospitalId,
      hospitalName: selectedHospital ? selectedHospital.hospitalName : '',
      hospitalAddress: selectedHospital ? selectedHospital.address : ''
    }));
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    
    if (!latitude || !longitude) {
      toast.error('Location access is required to create a blood request');
      return;
    }

    try {
      setCreatingRequest(true);
      
      const requestData = {
        ...formData,
        unitsNeeded: parseInt(formData.unitsNeeded),
        location: {
          latitude,
          longitude
        }
      };

      await createBloodRequest(requestData);
      toast.success('Blood request created successfully!');
      setShowCreateForm(false);
      setFormData({
        bloodGroup: '',
        unitsNeeded: 1,
        urgency: 'normal',
        selectedHospitalId: '',
        hospitalName: '',
        hospitalAddress: '',
        notes: ''
      });
      fetchMyRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error(error.response?.data?.message || 'Failed to create request');
    } finally {
      setCreatingRequest(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      setUpdatingStatus(requestId);
      await updateRequestStatus(requestId, 'cancelled');
      toast.success('Request cancelled successfully');
      fetchMyRequests();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="h-4 w-4" />,
      accepted: <CheckCircle className="h-4 w-4" />,
      confirmed: <CheckCircle className="h-4 w-4" />,
      completed: <CheckCircle className="h-4 w-4" />,
      cancelled: <XCircle className="h-4 w-4" />
    };
    return icons[status] || <AlertCircle className="h-4 w-4" />;
  };

  const getStatusTimeline = (request) => {
    const timeline = [
      { status: 'pending', label: 'Request Created', completed: true, date: request.createdAt },
      { status: 'accepted', label: 'Donor Accepted', completed: request.status !== 'pending', date: request.acceptedAt },
      { status: 'confirmed', label: 'Hospital Confirmed', completed: ['confirmed', 'completed'].includes(request.status), date: request.confirmedAt },
      { status: 'completed', label: 'Donation Completed', completed: request.status === 'completed', date: request.completedAt }
    ];
    return timeline;
  };

  const getStatusDescription = (status) => {
    const descriptions = {
      pending: 'Waiting for a donor to accept your request',
      accepted: 'A donor has accepted your request and will be on their way',
      confirmed: 'The hospital has confirmed the donor and is preparing for the donation',
      completed: 'Blood donation has been completed successfully',
      cancelled: 'This request has been cancelled'
    };
    return descriptions[status] || 'Unknown status';
  };

  const activeRequests = myRequests.filter(req => ['pending', 'accepted', 'confirmed'].includes(req.status));
  const pastRequests = myRequests.filter(req => ['completed', 'cancelled'].includes(req.status));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto mb-4"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            <Heart className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-heartbeat" />
          </div>
          <p className="text-gray-600 text-lg font-medium animate-pulse-slow">Loading dashboard<span className="loading-dots"></span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-gray-900 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Patient Dashboard
          </h1>
          <p className="text-gray-600 mt-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Create blood requests and track their status
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-br from-red-100 to-red-200 rounded-md flex items-center justify-center animate-bounce-slow">
                  <Heart className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Requests</p>
                <p className="text-2xl font-bold text-gray-900">{activeRequests.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-br from-green-100 to-green-200 rounded-md flex items-center justify-center animate-bounce-slow">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pastRequests.filter(req => req.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-md flex items-center justify-center animate-bounce-slow">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{myRequests.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Request Button */}
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-800 flex items-center space-x-2 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl animate-pulse-slow"
          >
            <Plus className="h-5 w-5 animate-wiggle" />
            <span>Create Blood Request</span>
          </button>
        </div>

        {/* Create Request Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in-up">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-in-up shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Create Blood Request</h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                {locationError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <p className="text-sm text-red-800">
                          Location access is required to create a blood request. Please enable location access and refresh the page.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCreateRequest} className="space-y-6 animate-fade-in-up">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Group *
                      </label>
                      <select
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 hover:border-red-300"
                      >
                        <option value="">Select Blood Group</option>
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

                    <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Units Needed *
                      </label>
                      <input
                        type="number"
                        name="unitsNeeded"
                        value={formData.unitsNeeded}
                        onChange={handleInputChange}
                        min="1"
                        max="10"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 hover:border-red-300"
                      />
                    </div>
                  </div>

                  <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgency Level *
                    </label>
                    <select
                      name="urgency"
                      value={formData.urgency}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 hover:border-red-300"
                    >
                      <option value="normal">Normal</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building2 className="inline h-4 w-4 mr-1" />
                      Select Hospital *
                    </label>
                    {hospitalsLoading ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
                        Loading hospitals...
                      </div>
                    ) : (
                      <select
                        name="selectedHospitalId"
                        value={formData.selectedHospitalId}
                        onChange={handleHospitalChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 hover:border-red-300"
                      >
                        <option value="">Select a registered hospital</option>
                        {hospitals.map(hospital => (
                          <option key={hospital._id} value={hospital._id}>
                            {hospital.hospitalName} - {hospital.address}
                          </option>
                        ))}
                      </select>
                    )}
                    {hospitals.length === 0 && !hospitalsLoading && (
                      <p className="text-sm text-gray-500 mt-1">
                        No registered hospitals available. Please contact support.
                      </p>
                    )}
                  </div>

                  {/* Selected Hospital Details */}
                  {formData.selectedHospitalId && (
                    <div className="animate-fade-in-up bg-green-50 p-4 rounded-lg border border-green-200" style={{ animationDelay: '0.5s' }}>
                      <div className="flex items-start">
                        <Building2 className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-900">Selected Hospital</p>
                          <p className="text-sm text-green-800 font-medium">{formData.hospitalName}</p>
                          <p className="text-sm text-green-700">{formData.hospitalAddress}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Any additional information (optional)"
                    />
                  </div>

                  <div className="flex justify-end space-x-4 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-all duration-200 hover:scale-105"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingRequest || locationError}
                      className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-md hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      {creatingRequest ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      <span>{creatingRequest ? 'Creating...' : 'Create Request'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Requests */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 transform hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600 animate-pulse" />
                Active Requests
              </h3>
            </div>
            <div className="p-6">
              {activeRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active requests</p>
                  <p className="text-sm text-gray-400">Create a new request to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeRequests.map((request, index) => (
                    <div key={request._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${0.8 + index * 0.1}s` }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {request.bloodGroup} Blood Request
                          </h4>
                          <p className="text-sm text-gray-600">{request.hospitalName}</p>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                            {request.urgency}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1 capitalize">{request.status.replace('_', ' ')}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          {request.unitsNeeded} unit{request.unitsNeeded > 1 ? 's' : ''} needed
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Building className="h-4 w-4 mr-2" />
                          {request.hospitalAddress}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          Created: {formatDate(request.createdAt)}
                        </div>
                        {request.donorId && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            Got blood from: {request.donorId.name}
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-700">
                          <strong>Status:</strong> {getStatusDescription(request.status)}
                        </p>
                      </div>

                      {/* Status Timeline */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Request Timeline</h5>
                        <div className="flex items-center space-x-2">
                          {getStatusTimeline(request).map((step, index) => (
                            <div key={step.status} className="flex items-center">
                              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                                step.completed 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-gray-300 text-gray-600'
                              }`}>
                                {step.completed ? <CheckCircle className="h-3 w-3" /> : index + 1}
                              </div>
                              <div className="ml-1">
                                <p className={`text-xs font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {step.label}
                                </p>
                                {step.date && (
                                  <p className="text-xs text-gray-500">{formatDate(step.date)}</p>
                                )}
                              </div>
                              {index < getStatusTimeline(request).length - 1 && (
                                <div className={`w-4 h-0.5 mx-1 ${step.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleCancelRequest(request._id)}
                          disabled={updatingStatus === request._id}
                          className="w-full bg-gradient-to-r from-red-100 to-red-200 text-red-700 px-4 py-2 rounded-md hover:from-red-200 hover:to-red-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          {updatingStatus === request._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700"></div>
                          ) : (
                            'Cancel Request'
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Past Requests */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 transform hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600 animate-pulse" />
                Past Requests
              </h3>
            </div>
            <div className="p-6">
              {pastRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No past requests</p>
                  <p className="text-sm text-gray-400">Your completed and cancelled requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastRequests.map((request, index) => (
                    <div key={request._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${1.0 + index * 0.1}s` }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {request.bloodGroup} Blood Request
                          </h4>
                          <p className="text-sm text-gray-600">{request.hospitalName}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status.replace('_', ' ')}</span>
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          {request.unitsNeeded} unit{request.unitsNeeded > 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          Created: {formatDate(request.createdAt)}
                        </div>
                        {request.completedAt && (
                          <div className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed: {formatDate(request.completedAt)}
                          </div>
                        )}
                        {request.donorId && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            Got blood from: {request.donorId.name}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
