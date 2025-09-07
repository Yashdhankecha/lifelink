const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');
require('dotenv').config({ path: './config.env' });

const recreateAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing admin
    await Admin.deleteOne({ email: 'admin@lifelink.com' });
    console.log('Deleted existing admin');

    // Create new admin (password will be hashed by pre-save hook)
    const adminData = {
      name: 'System Administrator',
      email: 'admin@lifelink.com',
      password: 'admin123456', // This will be hashed by pre-save hook
      role: 'admin',
      isVerified: true
    };

    const admin = await Admin.create(adminData);
    console.log('Admin recreated successfully:', {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isVerified: admin.isVerified
    });

  } catch (error) {
    console.error('Error recreating admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
recreateAdmin();
