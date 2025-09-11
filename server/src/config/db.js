const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds for faster startup
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 10000, // 10 seconds for faster startup
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    console.error('Full error:', error);
    
    // In production, don't exit immediately - let the server start
    // The health check will indicate database connectivity issues
    if (process.env.NODE_ENV === 'production') {
      console.log('Server will start without database connection. Retrying connection in background...');
      
      // Retry connection every 30 seconds
      setTimeout(() => {
        connectDB();
      }, 30000);
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
