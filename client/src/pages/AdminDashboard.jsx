import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './admin/Dashboard';
import UsersManagement from './admin/Users';
import Hospitals from './admin/Hospitals';
import Requests from './admin/Requests';
import Analytics from './admin/Analytics';

const AdminDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/users" element={<UsersManagement />} />
      <Route path="/hospitals" element={<Hospitals />} />
      <Route path="/requests" element={<Requests />} />
      <Route path="/analytics" element={<Analytics />} />
    </Routes>
  );
};

export default AdminDashboard;
