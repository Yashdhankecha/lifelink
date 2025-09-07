const mongoose = require('mongoose');
const Admin = require('./src/models/Admin');
require('dotenv').config({ path: './config.env' });

async function verifyAdmin() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Check if admin exists
    const admin = await Admin.findOne({ email: 'admin@lifelink.com' });
    
    if (admin) {
      console.log('✅ Admin user found:');
      console.log('- Email:', admin.email);
      console.log('- Name:', admin.name);
      console.log('- Role:', admin.role);
      console.log('- Verified:', admin.isVerified);
      console.log('- Active:', admin.isActive);
    } else {
      console.log('❌ Admin user not found');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

verifyAdmin();
