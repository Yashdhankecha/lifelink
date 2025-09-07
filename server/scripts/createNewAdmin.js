const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../src/models/Admin');
require('dotenv').config({ path: './config.env' });

const createNewAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing admin
    await Admin.deleteOne({ email: 'admin@lifelink.com' });
    console.log('Deleted existing admin');

    // Create new admin
    const adminData = {
      name: 'System Administrator',
      email: 'admin@lifelink.com',
      password: 'admin123456', // This will be hashed by the pre-save middleware
      role: 'admin',
      isVerified: true
    };

    const admin = new Admin(adminData);
    await admin.save();

    console.log('New admin created successfully:');
    console.log('Email: admin@lifelink.com');
    console.log('Password: admin123456');
    console.log('Role: admin');
    console.log('Verified: true');

    // Test the password
    const testAdmin = await Admin.findOne({ email: 'admin@lifelink.com' }).select('+password');
    const isMatch = await testAdmin.matchPassword('admin123456');
    console.log('Password test result:', isMatch);

  } catch (error) {
    console.error('Error creating new admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createNewAdmin();
