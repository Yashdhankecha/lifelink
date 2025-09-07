const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
require('dotenv').config({ path: './config.env' });

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@lifelink.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const adminData = {
      name: 'System Administrator',
      email: 'admin@lifelink.com',
      password: 'admin123456', // This will be hashed by the pre-save middleware
      role: 'admin',
      bloodGroup: 'O+', // Required field, but not relevant for admin
      isVerified: true,
      isActive: true,
      adminLevel: 'super',
      permissions: ['user_management', 'request_management', 'analytics', 'system_settings']
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('Admin user created successfully:');
    console.log('Email: admin@lifelink.com');
    console.log('Password: admin123456');
    console.log('Role: admin');
    console.log('Admin Level: super');
    console.log('Permissions: user_management, request_management, analytics, system_settings');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createAdmin();