import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { registerUser, registerHospital } from '../services/authService';
import { useGeolocation } from '../hooks/useGeolocation';
import { Eye, EyeOff, Heart, MapPin, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const Signup = () => {
  const [userType, setUserType] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const { latitude, longitude, error: locationError, loading: locationLoading, getCurrentLocation, hasLocation } = useGeolocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm();

  const password = watch('password');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // For users, include location data if available
      if (userType === 'user') {
        if (hasLocation) {
          data.location = { latitude, longitude };
        } else {
          // If no location available, we'll allow signup without location
          // Location can be set later in the dashboard
          data.location = { latitude: null, longitude: null };
        }
      }

      let response;
      switch (userType) {
        case 'user':
          response = await registerUser(data);
          break;
        case 'hospital':
          response = await registerHospital(data);
          break;
        default:
          throw new Error('Invalid user type');
      }

      if (response.success) {
        toast.success(response.message);
        
        // Navigate to OTP verification page
        navigate('/verify-otp', {
          state: {
            email: response.email,
            userType: response.userType,
            otp: response.otp // Include OTP if provided (development or email failure)
          }
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const userTypeOptions = [
    { value: 'user', label: 'Donor/Patient' },
    { value: 'hospital', label: 'Hospital' }
  ];

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div>
          <div className="flex justify-center">
            <Heart className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* User Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I am a:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setUserType(option.value);
                    reset();
                  }}
                  className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 min-h-[44px] flex items-center justify-center ${
                    userType === option.value
                      ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {userType === 'hospital' ? 'Contact Person Name' : 'Full Name'}
              </label>
              <input
                {...register('name', {
                  required: 'Name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  },
                  maxLength: {
                    value: 50,
                    message: 'Name cannot exceed 50 characters'
                  }
                })}
                type="text"
                className="input-field mt-1 min-h-[44px] text-base"
                placeholder="Enter your name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className="input-field mt-1 min-h-[44px] text-base"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Hospital-specific fields */}
            {userType === 'hospital' && (
              <>
                <div>
                  <label htmlFor="hospitalName" className="block text-sm font-medium text-gray-700">
                    Hospital Name
                  </label>
                  <input
                    {...register('hospitalName', {
                      required: 'Hospital name is required',
                      minLength: {
                        value: 2,
                        message: 'Hospital name must be at least 2 characters'
                      }
                    })}
                    type="text"
                    className="input-field mt-1 min-h-[44px] text-base"
                    placeholder="Enter hospital name"
                  />
                  {errors.hospitalName && (
                    <p className="mt-1 text-sm text-red-600">{errors.hospitalName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Hospital Address
                  </label>
                  <textarea
                    {...register('address', {
                      required: 'Hospital address is required',
                      minLength: {
                        value: 10,
                        message: 'Address must be at least 10 characters'
                      }
                    })}
                    rows={3}
                    className="input-field mt-1 text-base min-h-[80px]"
                    placeholder="Enter hospital address"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                    License Number
                  </label>
                  <input
                    {...register('licenseNumber', {
                      required: 'License number is required',
                      minLength: {
                        value: 5,
                        message: 'License number must be at least 5 characters'
                      }
                    })}
                    type="text"
                    className="input-field mt-1 min-h-[44px] text-base"
                    placeholder="Enter license number"
                  />
                  {errors.licenseNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.licenseNumber.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                    Contact Number
                  </label>
                  <input
                    {...register('contactNumber', {
                      required: 'Contact number is required',
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Please provide a valid 10-digit contact number'
                      }
                    })}
                    type="tel"
                    className="input-field mt-1 min-h-[44px] text-base"
                    placeholder="Enter 10-digit contact number"
                  />
                  {errors.contactNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.contactNumber.message}</p>
                  )}
                </div>
              </>
            )}

            {/* User-specific fields */}
            {userType === 'user' && (
              <div>
                <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700">
                  Blood Group
                </label>
                <select
                  {...register('bloodGroup', {
                    required: 'Blood group is required'
                  })}
                  className="input-field mt-1 min-h-[44px] text-base"
                >
                  <option value="">Select blood group</option>
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
                {errors.bloodGroup && (
                  <p className="mt-1 text-sm text-red-600">{errors.bloodGroup.message}</p>
                )}
              </div>
            )}

            {/* User-specific location section */}
            {userType === 'user' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Location (Optional)
                </label>
                
                {!hasLocation && !locationLoading && !locationError && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      You can add your location now or later in your dashboard. This helps other users find donors nearby.
                    </p>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 transition-colors"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>Get My Location</span>
                    </button>
                  </div>
                )}
                
                {locationLoading && (
                  <div className="flex items-center space-x-2 text-gray-600 py-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Getting your location...</span>
                  </div>
                )}
                
                {hasLocation && (
                  <div className="space-y-3 p-3 bg-green-50 rounded-md border border-green-200">
                    <div className="flex items-center space-x-2 text-green-700">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-medium">Location detected successfully</span>
                    </div>
                    <div className="text-xs text-green-600">
                      <div>Latitude: {latitude?.toFixed(6)}</div>
                      <div>Longitude: {longitude?.toFixed(6)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Update Location
                    </button>
                  </div>
                )}
                
                {locationError && (
                  <div className="space-y-2 p-3 bg-red-50 rounded-md border border-red-200">
                    <div className="flex items-center space-x-2 text-red-700">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-medium">Location access failed</span>
                    </div>
                    <p className="text-xs text-red-600">{locationError}</p>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="text-xs text-primary-600 hover:text-primary-500 font-medium underline"
                    >
                      Try again
                    </button>
                  </div>
                )}
                
                {!hasLocation && (
                  <p className="text-xs text-gray-500">
                    Don't worry! You can set your location later in your dashboard. This helps us find nearby blood donors and hospitals.
                  </p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-10 min-h-[44px] text-base"
                    placeholder="Enter your password"
                  />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center min-h-[44px] min-w-[44px] justify-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match'
                })}
                type="password"
                className="input-field mt-1 min-h-[44px] text-base"
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
