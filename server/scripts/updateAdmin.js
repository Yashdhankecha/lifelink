const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');
require('dotenv').config({ path: './config.env' });

const updateAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update admin to be verified
    const admin = await Admin.findOneAndUpdate(
      { email: 'admin@lifelink.com' },
      { isVerified: true },
      { new: true }
    );

    if (admin) {
      console.log('Admin updated successfully:', {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isVerified: admin.isVerified
      });
    } else {
      console.log('Admin not found');
    }

  } catch (error) {
    console.error('Error updating admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
updateAdmin();
