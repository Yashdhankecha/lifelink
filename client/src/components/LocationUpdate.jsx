import React, { useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { updateUserLocation } from '../services/api';
import { MapPin, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const LocationUpdate = ({ onLocationUpdate }) => {
  const { latitude, longitude, error: locationError, loading: locationLoading, getCurrentLocation, hasLocation } = useGeolocation();
  const [updating, setUpdating] = useState(false);

  const handleUpdateLocation = async () => {
    if (!hasLocation) {
      toast.error('Please allow location access first');
      return;
    }

    setUpdating(true);
    try {
      const response = await updateUserLocation({ latitude, longitude });
      if (response.data.success) {
        toast.success('Location updated successfully!');
        if (onLocationUpdate) {
          onLocationUpdate({ latitude, longitude });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update location');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-4">
        <MapPin className="h-5 w-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">Update Location</h3>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
          {locationLoading ? (
            <div className="flex items-center space-x-2 text-gray-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Getting your location...</span>
            </div>
          ) : hasLocation ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Location detected</span>
              </div>
              <div className="text-xs text-gray-600">
                <div>Latitude: {latitude?.toFixed(6)}</div>
                <div>Longitude: {longitude?.toFixed(6)}</div>
              </div>
            </div>
          ) : locationError ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Location access failed</span>
              </div>
              <p className="text-xs text-red-600">{locationError}</p>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">Unable to detect location</span>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={locationLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {locationLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Getting Location</span>
              </div>
            ) : (
              'Refresh Location'
            )}
          </button>

          <button
            type="button"
            onClick={handleUpdateLocation}
            disabled={!hasLocation || updating}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Updating</span>
              </div>
            ) : (
              'Update Location'
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Your location helps us find nearby blood donors and hospitals. You can update it anytime.
        </p>
      </div>
    </div>
  );
};

export default LocationUpdate;
