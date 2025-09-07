import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Calendar, Users, AlertCircle, Building2 } from 'lucide-react';
import { createBloodRequest, updateBloodRequest } from '../services/requestService';
import { getRegisteredHospitals } from '../services/userService';
import { useGeolocation } from '../hooks/useGeolocation';

const BloodRequestForm = ({ isOpen, onClose, onSuccess, editData, isEditing = false }) => {
  const { latitude, longitude } = useGeolocation();
  const [loading, setLoading] = useState(false);
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

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

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

    if (isOpen) {
      fetchHospitals();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (isEditing && editData) {
      setFormData({
        bloodGroup: editData.bloodGroup || '',
        unitsNeeded: editData.unitsNeeded || 1,
        urgency: editData.urgency || 'normal',
        hospitalName: editData.hospitalName || '',
        hospitalAddress: editData.hospitalAddress || '',
        notes: editData.notes || ''
      });
    } else {
      // Reset form for new requests
      setFormData({
        bloodGroup: '',
        unitsNeeded: 1,
        urgency: 'normal',
        selectedHospitalId: '',
        hospitalName: '',
        hospitalAddress: '',
        notes: ''
      });
    }
  }, [isEditing, editData]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!latitude || !longitude) {
      alert('Please enable location access to create a blood request');
      return;
    }

    try {
      setLoading(true);
      
      const requestData = {
        ...formData,
        unitsNeeded: parseInt(formData.unitsNeeded),
        location: {
          latitude,
          longitude
        }
      };

      if (isEditing && editData) {
        await updateBloodRequest(editData._id, requestData);
      } else {
        await createBloodRequest(requestData);
      }
      
      // Reset form
      setFormData({
        bloodGroup: '',
        unitsNeeded: 1,
        urgency: 'normal',
        hospitalName: '',
        hospitalAddress: '',
        notes: ''
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating blood request:', error);
      alert('Failed to create blood request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Blood Request' : 'Create Blood Request'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Blood Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Group Required *
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            {/* Units Needed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Units Needed *
              </label>
              <select
                name="unitsNeeded"
                value={formData.unitsNeeded}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(unit => (
                  <option key={unit} value={unit}>{unit} unit{unit > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.urgency === 'normal' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="urgency"
                    value="normal"
                    checked={formData.urgency === 'normal'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <div className="h-4 w-4 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-gray-900">Normal</p>
                      <p className="text-sm text-gray-500">Regular blood request</p>
                    </div>
                  </div>
                </label>
                
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.urgency === 'critical' ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="urgency"
                    value="critical"
                    checked={formData.urgency === 'critical'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <div className="h-4 w-4 bg-red-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-gray-900">Critical</p>
                      <p className="text-sm text-gray-500">Emergency situation</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Hospital Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="inline h-4 w-4 mr-1" />
                Select Hospital *
              </label>
              {hospitalsLoading ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
                  Loading hospitals...
                </div>
              ) : (
                <select
                  name="selectedHospitalId"
                  value={formData.selectedHospitalId}
                  onChange={handleHospitalChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
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

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Any additional information (optional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Location Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Location</p>
                  <p className="text-sm text-blue-700">
                    {latitude && longitude 
                      ? `Using your current location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                      : 'Location access required'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={loading || !latitude || !longitude}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Request' : 'Create Request')}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default BloodRequestForm;
