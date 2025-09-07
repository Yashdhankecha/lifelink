import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getMyRequests, 
  confirmBloodRequest, 
  completeBloodRequest,
  getStatusColor,
  getUrgencyColor,
  formatDate
} from '../services/requestService';
import { Building2, MapPin, Phone, Mail, CheckCircle, Clock, AlertCircle, Heart, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const HospitalDashboard = () => {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingRequest, setConfirmingRequest] = useState(null);
  const [completingRequest, setCompletingRequest] = useState(null);

  useEffect(() => {
    if (user) {
      fetchMyRequests();
    }
  }, [user]);

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

  const handleConfirmRequest = async (requestId) => {
    try {
      setConfirmingRequest(requestId);
      await confirmBloodRequest(requestId);
      toast.success('Request confirmed successfully!');
      fetchMyRequests(); // Refresh data
    } catch (error) {
      console.error('Error confirming request:', error);
      toast.error(error.response?.data?.message || 'Failed to confirm request');
    } finally {
      setConfirmingRequest(null);
    }
  };

  const handleCompleteRequest = async (requestId) => {
    try {
      setCompletingRequest(requestId);
      await completeBloodRequest(requestId);
      toast.success('Request completed successfully!');
      fetchMyRequests(); // Refresh data
    } catch (error) {
      console.error('Error completing request:', error);
      toast.error(error.response?.data?.message || 'Failed to complete request');
    } finally {
      setCompletingRequest(null);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hospital dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-2">
                {user?.hospitalName} - Hospital Dashboard
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {user?.verifiedStatus ? (
                <span className="flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Verified
                </span>
              ) : (
                <span className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                  <Clock className="h-4 w-4 mr-1" />
                  Pending Verification
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Hospital Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hospital Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900">{user?.hospitalName}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900">{user?.address}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900">{user?.contactNumber}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900">{user?.email}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Requests</span>
                <span className="font-semibold text-gray-900">{myRequests.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending</span>
                <span className="font-semibold text-yellow-600">
                  {myRequests.filter(req => req.status === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Accepted</span>
                <span className="font-semibold text-blue-600">
                  {myRequests.filter(req => req.status === 'accepted').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">
                  {myRequests.filter(req => req.status === 'completed').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Blood Requests */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Blood Requests Management</h3>
          <div className="space-y-6">
            {myRequests.length > 0 ? (
              myRequests.map((request) => {
                const timeline = getStatusTimeline(request);
                return (
                  <div key={request._id} className="p-6 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                          <Heart className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{request.bloodGroup} Blood Request</h4>
                          <p className="text-sm text-gray-600">{request.unitsNeeded} unit{request.unitsNeeded > 1 ? 's' : ''} needed</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(request.urgency)}`}>
                          {request.urgency}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Request Timeline</h5>
                      <div className="flex items-center space-x-4">
                        {timeline.map((step, index) => (
                          <div key={step.status} className="flex items-center">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${
                              step.completed 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {step.completed ? <CheckCircle className="h-4 w-4" /> : index + 1}
                            </div>
                            <div className="ml-2">
                              <p className={`text-xs font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                                {step.label}
                              </p>
                              {step.date && (
                                <p className="text-xs text-gray-500">{formatDate(step.date)}</p>
                              )}
                            </div>
                            {index < timeline.length - 1 && (
                              <div className={`w-8 h-0.5 mx-2 ${step.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Donor Information (if accepted) */}
                    {request.donorId && (
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h5 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Donor Information
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <p className="text-sm text-blue-700">
                              <strong>Name:</strong> {request.donorId.name}
                            </p>
                            <p className="text-sm text-blue-700">
                              <strong>Blood Group:</strong> {request.donorId.bloodGroup}
                            </p>
                          </div>
                          <div className="space-y-2">
                            {request.donorId.phone && (
                              <p className="text-sm text-blue-700">
                                <strong>Phone:</strong> 
                                <a href={`tel:${request.donorId.phone}`} className="text-blue-600 hover:text-blue-800 ml-1">
                                  {request.donorId.phone}
                                </a>
                              </p>
                            )}
                            {request.donorId.email && (
                              <p className="text-sm text-blue-700">
                                <strong>Email:</strong> 
                                <a href={`mailto:${request.donorId.email}`} className="text-blue-600 hover:text-blue-800 ml-1">
                                  {request.donorId.email}
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                        {request.acceptedAt && (
                          <p className="text-xs text-blue-600 mt-2">
                            Accepted on: {formatDate(request.acceptedAt)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Patient Information */}
                    {request.requesterId && (
                      <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h5 className="text-sm font-medium text-purple-800 mb-3 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Patient Information
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <p className="text-sm text-purple-700">
                              <strong>Name:</strong> {request.requesterId.name}
                            </p>
                            <p className="text-sm text-purple-700">
                              <strong>Required Blood:</strong> {request.bloodGroup}
                            </p>
                          </div>
                          <div className="space-y-2">
                            {request.requesterId.phone && (
                              <p className="text-sm text-purple-700">
                                <strong>Phone:</strong> 
                                <a href={`tel:${request.requesterId.phone}`} className="text-purple-600 hover:text-purple-800 ml-1">
                                  {request.requesterId.phone}
                                </a>
                              </p>
                            )}
                            {request.requesterId.email && (
                              <p className="text-sm text-purple-700">
                                <strong>Email:</strong> 
                                <a href={`mailto:${request.requesterId.email}`} className="text-purple-600 hover:text-purple-800 ml-1">
                                  {request.requesterId.email}
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-purple-600 mt-2">
                          Request created: {formatDate(request.createdAt)}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      {request.status === 'accepted' && (
                        <button
                          onClick={() => handleConfirmRequest(request._id)}
                          disabled={confirmingRequest === request._id}
                          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {confirmingRequest === request._id ? 'Confirming...' : 'Confirm Donor'}
                        </button>
                      )}
                      {request.status === 'confirmed' && (
                        <button
                          onClick={() => handleCompleteRequest(request._id)}
                          disabled={completingRequest === request._id}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {completingRequest === request._id ? 'Completing...' : 'Mark as Completed'}
                        </button>
                      )}
                      <button className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700">
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No blood requests found</p>
                <p className="text-gray-400 text-sm">Create your first blood request to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;
