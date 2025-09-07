const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');
require('dotenv').config({ path: './config.env' });

const checkAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin
    const admin = await Admin.findOne({ email: 'admin@lifelink.com' }).select('+password');
    
    if (admin) {
      console.log('Admin found:', {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isVerified: admin.isVerified,
        hasPassword: !!admin.password
      });
      
      // Test password match
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare('admin123456', admin.password);
      console.log('Password match test:', isMatch);
      console.log('Password hash:', admin.password);
      
      // Test with different passwords
      const testPasswords = ['admin123456', 'admin123', 'password', '123456'];
      for (const testPass of testPasswords) {
        const testMatch = await bcrypt.compare(testPass, admin.password);
        console.log(`Password "${testPass}" match:`, testMatch);
      }
    } else {
      console.log('Admin not found');
    }

  } catch (error) {
    console.error('Error checking admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
checkAdmin();
