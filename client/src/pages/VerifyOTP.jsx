import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { verifyOTP, resendOTP } from '../services/authService';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyOTP = () => {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const { email, userType, otp: providedOTP } = location.state || {};

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm();

  const otp = watch('otp');

  useEffect(() => {
    if (!email || !userType) {
      navigate('/signup');
      return;
    }

    // Start countdown for resend button
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, userType, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await verifyOTP({
        email,
        otp: data.otp,
        userType
      });

      if (response.success) {
        toast.success('Email verified successfully! You can now login.');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      const response = await resendOTP({ email, userType });
      if (response.success) {
        toast.success('New OTP sent to your email');
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setValue('otp', value);
  };

  if (!email || !userType) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Mail className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a 6-digit OTP to{' '}
            <span className="font-medium text-primary-600">{email}</span>
          </p>
          
          {/* Show OTP if provided (development or email failure) */}
          {providedOTP && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 text-center">
                <strong>Development Mode:</strong> Your OTP is{' '}
                <span className="font-mono text-lg font-bold text-yellow-900">
                  {providedOTP}
                </span>
              </p>
            </div>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              Enter OTP
            </label>
            <input
              {...register('otp', {
                required: 'OTP is required',
                minLength: {
                  value: 6,
                  message: 'OTP must be 6 digits'
                },
                maxLength: {
                  value: 6,
                  message: 'OTP must be 6 digits'
                }
              })}
              type="text"
              inputMode="numeric"
              className="input-field mt-1 text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
              maxLength={6}
              onChange={handleOTPChange}
            />
            {errors.otp && (
              <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !otp || otp.length !== 6}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Verify Email'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the OTP?{' '}
              {countdown > 0 ? (
                <span className="text-gray-500">
                  Resend in {countdown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendLoading}
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  {resendLoading ? (
                    <div className="inline-flex items-center">
                      <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                      Sending...
                    </div>
                  ) : (
                    'Resend OTP'
                  )}
                </button>
              )}
            </p>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Signup
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Important:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Check your spam folder if you don't see the email</li>
            <li>• OTP is valid for 10 minutes only</li>
            <li>• Do not share this OTP with anyone</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
