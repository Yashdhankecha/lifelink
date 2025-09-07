import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from '../../components/hospital/Dashboard';
import Requests from '../../components/hospital/Requests';
import Donors from '../../components/hospital/Donors';
import Analytics from '../../components/hospital/Analytics';
import Settings from '../../components/hospital/Settings';
import HospitalProfilePage from './HospitalProfilePage';

const HospitalDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/donors" element={<Donors />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<HospitalProfilePage />} />
        </Routes>
      </div>
    </div>
  );
};

export default HospitalDashboard;

