import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Award, Clock } from 'lucide-react';

const HistoryCard = ({ 
  history, 
  type = 'donation' // 'donation' or 'request'
}) => {
  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'N/A';
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {type === 'donation' ? 'Blood Donation' : 'Blood Request'}
          </h3>
          <p className="text-sm text-gray-600">
            {type === 'donation' 
              ? `Donated to ${history.requesterId?.name || 'Patient'}` 
              : `Requested for ${history.hospitalName}`
            }
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(history.status)}`}>
          {history.status}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-2 text-gray-400" />
          <span>{history.bloodGroup} - {history.unitsNeeded} unit{history.unitsNeeded > 1 ? 's' : ''}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
          <span className="truncate">
            {type === 'donation' 
              ? history.hospitalName 
              : history.hospitalAddress
            }
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          <span>
            {type === 'donation' 
              ? `Donated: ${formatDate(history.completedAt || history.acceptedAt)}`
              : `Created: ${formatDate(history.createdAt)}`
            }
          </span>
        </div>

        {type === 'donation' && history.requesterId && (
          <div className="flex items-center text-sm text-gray-600">
            <Award className="h-4 w-4 mr-2 text-gray-400" />
            <span>Helped: {history.requesterId.name}</span>
          </div>
        )}

        {type === 'request' && history.donorId && (
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2 text-gray-400" />
            <span>Donor: {history.donorId.name}</span>
          </div>
        )}
      </div>

      {/* Time ago */}
      <div className="flex items-center text-xs text-gray-500">
        <Clock className="h-3 w-3 mr-1" />
        <span>
          {type === 'donation' 
            ? getTimeAgo(history.completedAt || history.acceptedAt)
            : getTimeAgo(history.createdAt)
          }
        </span>
      </div>
    </motion.div>
  );
};

export default HistoryCard;
