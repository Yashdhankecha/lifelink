const mongoose = require('mongoose');

let retryCount = 0;
const maxRetries = 10; // Maximum number of retry attempts

const connectDB = async () => {
  // Check if MONGODB_URI is provided
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    console.log('Please set the MONGODB_URI environment variable in Railway dashboard');
    
    if (process.env.NODE_ENV === 'production') {
      console.log('Server will start without database connection. Set MONGODB_URI to enable database features.');
      return;
    } else {
      process.exit(1);
    }
  }

  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds for faster startup
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 10000, // 10 seconds for faster startup
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    retryCount = 0; // Reset retry count on successful connection
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    
    // In production, don't exit immediately - let the server start
    // The health check will indicate database connectivity issues
    if (process.env.NODE_ENV === 'production') {
      retryCount++;
      
      if (retryCount <= maxRetries) {
        console.log(`⚠️  Server will start without database connection. Retry attempt ${retryCount}/${maxRetries} in 30 seconds...`);
        
        // Retry connection every 30 seconds, but only if we haven't exceeded max retries
        setTimeout(() => {
          connectDB();
        }, 30000);
      } else {
        console.log('❌ Maximum retry attempts reached. Database connection will not be retried automatically.');
        console.log('Please check your MONGODB_URI and restart the server if needed.');
      }
    } else {
      console.error('Full error:', error);
      process.exit(1);
    }
  }
};

// Function to manually retry database connection (useful when env vars are updated)
const retryConnection = () => {
  if (process.env.MONGODB_URI) {
    console.log('🔄 Manually retrying database connection...');
    retryCount = 0; // Reset retry count
    connectDB();
  } else {
    console.log('❌ Cannot retry connection: MONGODB_URI is not set');
  }
};

// Export both functions
module.exports = {
  connectDB,
  retryConnection
};
