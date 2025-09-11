import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { loginUser, loginHospital, loginAdmin } from '../services/authService';
import { Eye, EyeOff, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, login, user } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard based on user role
      switch (user.role) {
        case 'hospital':
          navigate('/hospital/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      let response;
      let userData;
      
      // Try to login as user first
      try {
        response = await loginUser(data);
        if (response.success) {
          userData = response.user;
        }
      } catch (userError) {
        // If user login fails, try hospital
        try {
          response = await loginHospital(data);
          if (response.success) {
            userData = response.hospital;
          }
        } catch (hospitalError) {
          // If hospital login fails, try admin
          try {
            response = await loginAdmin(data);
            if (response.success) {
              userData = response.admin;
            }
          } catch (adminError) {
            throw new Error('Invalid credentials');
          }
        }
      }

      if (response.success && userData) {
        login(userData);
        
        // Navigate to appropriate dashboard
        let targetPath;
        switch (userData.role) {
          case 'hospital':
            targetPath = '/hospital/dashboard';
            break;
          case 'admin':
            targetPath = '/admin/dashboard';
            break;
          default:
            targetPath = '/dashboard';
        }
        
        // Use navigate instead of window.location.href to avoid page reload
        navigate(targetPath);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      
      // If user needs email verification, redirect to OTP page
      if (error.response?.data?.email && error.response?.data?.userType) {
        toast.error(errorMessage);
        navigate('/verify-otp', {
          state: {
            email: error.response.data.email,
            userType: error.response.data.userType
          }
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Heart className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/signup"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* User Type Selection */}

          <div className="space-y-4">
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
                className="input-field mt-1"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

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
                  className="input-field pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
