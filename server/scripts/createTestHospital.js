const mongoose = require('mongoose');
const Hospital = require('../src/models/Hospital');

require('dotenv').config({ path: './config.env' });

const createTestHospital = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if test hospital already exists
    const existingHospital = await Hospital.findOne({ email: 'test@hospital.com' });
    if (existingHospital) {
      console.log('Test hospital already exists');
      console.log('Email: test@hospital.com');
      console.log('Password: test123456');
      console.log('Status:', existingHospital.isVerified ? 'Email Verified' : 'Email Not Verified');
      console.log('Admin Approval:', existingHospital.verifiedStatus ? 'Approved' : 'Pending');
      return;
    }

    // Create test hospital
    const hospitalData = {
      name: 'Test Hospital Admin',
      email: 'test@hospital.com',
      password: 'test123456',
      hospitalName: 'Test General Hospital',
      address: '123 Test Street, Test City, Test State 12345',
      licenseNumber: 'TEST123456',
      contactNumber: '9876543210',
      phone: '9876543210',
      isVerified: true, // Skip email verification for testing
      verifiedStatus: true, // Skip admin approval for testing
      isActive: true
    };

    const hospital = new Hospital(hospitalData);
    await hospital.save();

    console.log('Test hospital created successfully:');
    console.log('Email: test@hospital.com');
    console.log('Password: test123456');
    console.log('Hospital Name: Test General Hospital');
    console.log('Status: Email Verified & Admin Approved');
    console.log('License Number: TEST123456');

  } catch (error) {
    console.error('Error creating test hospital:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createTestHospital();


