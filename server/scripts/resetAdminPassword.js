const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../src/models/Admin');
require('dotenv').config({ path: './config.env' });

const resetAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin and update password
    const admin = await Admin.findOne({ email: 'admin@lifelink.com' });
    
    if (admin) {
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123456', salt);
      
      // Update the password
      admin.password = hashedPassword;
      admin.isVerified = true;
      await admin.save();
      
      console.log('Admin password updated successfully:');
      console.log('Email: admin@lifelink.com');
      console.log('Password: admin123456');
      console.log('Role: admin');
      console.log('Verified: true');
    } else {
      console.log('Admin not found');
    }

  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
resetAdminPassword();
