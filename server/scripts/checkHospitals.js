const mongoose = require('mongoose');
const Hospital = require('../src/models/Hospital');

require('dotenv').config({ path: './config.env' });

const checkHospitals = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all hospitals
    const hospitals = await Hospital.find({}).select('-password');
    
    console.log(`\nFound ${hospitals.length} hospitals:`);
    console.log('=====================================');
    
    hospitals.forEach((hospital, index) => {
      console.log(`\n${index + 1}. Hospital Details:`);
      console.log(`   Name: ${hospital.name}`);
      console.log(`   Email: ${hospital.email}`);
      console.log(`   Hospital Name: ${hospital.hospitalName}`);
      console.log(`   License: ${hospital.licenseNumber}`);
      console.log(`   Email Verified: ${hospital.isVerified ? '✅ Yes' : '❌ No'}`);
      console.log(`   Admin Approved: ${hospital.verifiedStatus ? '✅ Yes' : '❌ No'}`);
      console.log(`   Active: ${hospital.isActive ? '✅ Yes' : '❌ No'}`);
      console.log(`   Created: ${hospital.createdAt}`);
    });

    // Check for test hospital specifically
    const testHospital = await Hospital.findOne({ email: 'test@hospital.com' });
    if (testHospital) {
      console.log('\n🎯 Test Hospital Found:');
      console.log('Email: test@hospital.com');
      console.log('Password: test123456');
      console.log('Status:', testHospital.isVerified ? 'Email Verified' : 'Email Not Verified');
      console.log('Admin Approval:', testHospital.verifiedStatus ? 'Approved' : 'Pending');
    } else {
      console.log('\n❌ Test hospital not found');
    }

  } catch (error) {
    console.error('Error checking hospitals:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

// Run the script
checkHospitals();


