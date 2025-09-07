import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import { Menu, X, User, LogOut, Heart, Search, Users, Building2, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout: authLogout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      authLogout();
      navigate('/');
      setIsOpen(false);
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    switch (user.role) {
      case 'hospital':
        return '/hospital/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/dashboard';
    }
  };

  const getDashboardName = () => {
    if (!user) return 'Dashboard';
    switch (user.role) {
      case 'hospital':
        return 'Hospital Dashboard';
      case 'admin':
        return 'Admin Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const adminNavItems = [
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Hospitals', href: '/admin/hospitals', icon: Building2 },
    { name: 'Requests', href: '/admin/requests', icon: Heart },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 }
  ];

  const hospitalNavItems = [
    { name: 'Dashboard', href: '/hospital/dashboard', icon: Building2 },
    { name: 'Requests', href: '/hospital/requests', icon: Heart },
    { name: 'Donors', href: '/hospital/donors', icon: Users },
    { name: 'Analytics', href: '/hospital/analytics', icon: BarChart3 }
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 animate-fade-in-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200">
              <Heart className="h-8 w-8 text-primary-600 animate-heartbeat" />
              <span className="text-xl font-bold text-gray-900">Life Link</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {!isAuthenticated && (
              <Link
                to="/"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
              >
                Home
              </Link>
            )}
            
            {isAuthenticated ? (
              <>
                {user?.role === 'user' ? (
                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
                  >
                    Dashboard
                  </Link>
                ) : user?.role === 'admin' ? (
                  <>
                    <Link
                      to={getDashboardLink()}
                      className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
                    >
                      {getDashboardName()}
                    </Link>
                    {adminNavItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </>
                ) : user?.role === 'hospital' ? (
                  <>
                    {hospitalNavItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </>
                ) : (
                  <Link
                    to={getDashboardLink()}
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
                  >
                    {getDashboardName()}
                  </Link>
                )}
                <div className="flex items-center space-x-4">
                  {user?.role !== 'admin' && user?.role !== 'hospital' && (
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
                    >
                      <User className="h-4 w-4" />
                      <span>{user?.name}</span>
                    </Link>
                  )}
                  {user?.role === 'hospital' && (
                    <Link
                      to="/hospital/profile"
                      className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
                    >
                      <Building2 className="h-4 w-4" />
                      <span>{user?.name}</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary hover:scale-105 transition-transform duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary-600 focus:outline-none focus:text-primary-600 transition-all duration-200 hover:scale-110"
            >
              {isOpen ? <X className="h-6 w-6 animate-wiggle" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden animate-slide-in-up">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {!isAuthenticated && (
              <Link
                to="/"
                className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
            )}
            
            {isAuthenticated ? (
              <>
                {user?.role === 'user' ? (
                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                ) : user?.role === 'admin' ? (
                  <>
                    <Link
                      to={getDashboardLink()}
                      className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      {getDashboardName()}
                    </Link>
                    {adminNavItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                          onClick={() => setIsOpen(false)}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </>
                ) : user?.role === 'hospital' ? (
                  <>
                    {hospitalNavItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                          onClick={() => setIsOpen(false)}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </>
                ) : (
                  <Link
                    to={getDashboardLink()}
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    {getDashboardName()}
                  </Link>
                )}
                <div className="px-3 py-2">
                  {user?.role === 'hospital' ? (
                    <Link
                      to="/hospital/profile"
                      className="flex items-center space-x-2 mb-2 text-gray-700 hover:text-primary-600 text-base font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      <Building2 className="h-4 w-4" />
                      <span>{user?.name}</span>
                    </Link>
                  ) : user?.role !== 'admin' && (
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 mb-2 text-gray-700 hover:text-primary-600 text-base font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      <span>{user?.name}</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 text-base font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary block text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}

    </nav>
  );
};

export default Navbar;
