import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getMe } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await getMe();
      if (response.success) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: 'Authentication failed' });
      }
    } catch (error) {
      // Silently handle auth failures - don't show errors for unauthenticated users
      // This is expected when no user is logged in
      if (error.response?.status === 401) {
        // User is not authenticated - this is normal
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      } else {
        // Other errors should be logged but not shown to user
        console.error('Authentication check failed:', error.message);
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    }
  };

  const login = (userData) => {
    dispatch({ type: 'AUTH_SUCCESS', payload: userData });
    toast.success('Login successful!');
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully!');
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const updateUser = (userData) => {
    dispatch({ type: 'AUTH_SUCCESS', payload: userData });
  };

  const value = {
    ...state,
    login,
    logout,
    clearError,
    checkAuthStatus,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
