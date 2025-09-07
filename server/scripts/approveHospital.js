const mongoose = require('mongoose');
const Hospital = require('../src/models/Hospital');

require('dotenv').config({ path: './config.env' });

const approveHospital = async (hospitalEmail) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find and approve the hospital
    const hospital = await Hospital.findOne({ email: hospitalEmail });
    
    if (!hospital) {
      console.log(`❌ Hospital with email ${hospitalEmail} not found`);
      return;
    }

    // Update the hospital's verified status
    hospital.verifiedStatus = true;
    await hospital.save();

    console.log(`✅ Hospital approved successfully!`);
    console.log(`Hospital: ${hospital.hospitalName}`);
    console.log(`Email: ${hospital.email}`);
    console.log(`Admin Approved: ${hospital.verifiedStatus ? '✅ Yes' : '❌ No'}`);

  } catch (error) {
    console.error('Error approving hospital:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

// Get email from command line argument
const hospitalEmail = process.argv[2];

if (!hospitalEmail) {
  console.log('Usage: node approveHospital.js <hospital-email>');
  console.log('Example: node approveHospital.js test.hospital@example.com');
  process.exit(1);
}

// Run the script
approveHospital(hospitalEmail);
