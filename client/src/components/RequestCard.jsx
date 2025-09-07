import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, AlertCircle, CheckCircle, XCircle, Activity } from 'lucide-react';

const RequestCard = ({ 
  request, 
  onAccept, 
  onDecline, 
  onCancel, 
  isAccepting = false,
  isDeclining = false,
  isCancelling = false,
  showActions = true,
  mode = 'donor' // 'donor' or 'patient'
}) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      on_the_way: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyColor = (urgency) => {
    return urgency === 'critical' 
      ? 'bg-red-100 text-red-800' 
      : 'bg-green-100 text-green-800';
  };

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {request.bloodGroup} Blood Request
          </h3>
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

      {/* Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-2 text-gray-400" />
          <span>{request.unitsNeeded} unit{request.unitsNeeded > 1 ? 's' : ''} needed</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
          <span className="truncate">{request.hospitalAddress}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2 text-gray-400" />
          <span>Created: {formatDate(request.createdAt)}</span>
        </div>

        {request.donorId && (
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2 text-gray-400" />
            <span>Donor: {request.donorId.name}</span>
          </div>
        )}

        {request.completedAt && (
          <div className="flex items-center text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            <span>Completed: {formatDate(request.completedAt)}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {request.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{request.notes}</p>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex space-x-3">
          {mode === 'donor' && request.status === 'pending' && (
            <>
              <motion.button
                onClick={() => onAccept(request._id)}
                disabled={isAccepting}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isAccepting ? (
                  <motion.div
                    className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  'Accept Request'
                )}
              </motion.button>
              
              <motion.button
                onClick={() => onDecline(request._id)}
                disabled={isDeclining}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isDeclining ? (
                  <motion.div
                    className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  'Decline'
                )}
              </motion.button>
            </>
          )}

          {mode === 'patient' && request.status === 'pending' && (
            <motion.button
              onClick={() => onCancel(request._id)}
              disabled={isCancelling}
              className="w-full bg-gradient-to-r from-red-100 to-red-200 text-red-700 px-4 py-2 rounded-lg hover:from-red-200 hover:to-red-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isCancelling ? (
                <motion.div
                  className="animate-spin rounded-full h-4 w-4 border-2 border-red-700 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                'Cancel Request'
              )}
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default RequestCard;
