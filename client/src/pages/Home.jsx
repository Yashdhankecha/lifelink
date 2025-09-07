import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Users, Building2, Shield, ArrowRight } from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: <Heart className="h-8 w-8 text-primary-600" />,
      title: 'Save Lives',
      description: 'Connect donors with patients in need of blood transfusions'
    },
    {
      icon: <Users className="h-8 w-8 text-primary-600" />,
      title: 'Community Driven',
      description: 'Join a community of compassionate donors and healthcare providers'
    },
    {
      icon: <Building2 className="h-8 w-8 text-primary-600" />,
      title: 'Hospital Network',
      description: 'Verified hospitals and medical facilities across the region'
    },
    {
      icon: <Shield className="h-8 w-8 text-primary-600" />,
      title: 'Secure & Safe',
      description: 'Your data is protected with enterprise-grade security'
    }
  ];

  const stats = [
    { label: 'Lives Saved', value: '10,000+' },
    { label: 'Active Donors', value: '5,000+' },
    { label: 'Partner Hospitals', value: '200+' },
    { label: 'Cities Covered', value: '50+' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Save Lives, <br />
              <span className="text-secondary-300">Donate Blood</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Connect donors with patients in need. Join our community of lifesavers and make a difference today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/signup"
                    className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
                  >
                    Join as Donor
                  </Link>
                  <Link
                    to="/signup"
                    className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
                  >
                    Register Hospital
                  </Link>
                </>
              ) : (
                <Link
                  to={user?.role === 'hospital' ? '/hospital/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                  className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition-colors inline-flex items-center"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Life Link?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We make blood donation simple, safe, and impactful for everyone involved.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of donors and hospitals working together to save lives every day.
          </p>
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
              >
                Get Started Today
              </Link>
              <Link
                to="/login"
                className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <Heart className="h-8 w-8 text-primary-600 mr-2" />
              <span className="text-2xl font-bold">Life Link</span>
            </div>
            <p className="text-gray-400 mb-4">
              Connecting donors with patients to save lives
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 Life Link. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
