import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, AlertCircle, RefreshCw } from 'lucide-react';

const LocationPermission = ({ onRequestLocation, loading, error }) => {
  return (
    <motion.div 
      className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Location Access Required
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            To find nearby blood requests and donors, please allow location access.
          </p>
          {error && (
            <p className="text-xs text-red-600 mt-2">
              {error}
            </p>
          )}
          <motion.button
            onClick={onRequestLocation}
            disabled={loading}
            className="mt-3 inline-flex items-center space-x-2 px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Requesting...</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                <span>Allow Location</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default LocationPermission;
