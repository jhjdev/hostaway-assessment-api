import mongoose from 'mongoose';

let isConnected = false;

export async function connectToDatabase(uri: string): Promise<void> {
  if (isConnected) {
    console.log('Already connected to MongoDB');
    return;
  }

  try {
    console.log('Connecting to MongoDB with Mongoose...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('URI format:', uri.replace(/:\/\/.*@/, '://***:***@'));

    // Mongoose connection options optimized for Atlas and Render
    const options = {
      // Connection timeout
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      
      // Connection pool
      maxPoolSize: 5,
      minPoolSize: 1,
      
      // Retry logic
      retryWrites: true,
      retryReads: true,
    };

    await mongoose.connect(uri, options);
    
    isConnected = true;
    console.log('✅ MongoDB connected successfully with Mongoose');
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });

  } catch (error) {
    console.error('MongoDB connection failed:', error);
    isConnected = false;
    throw error;
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }
  
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
}

export function getConnectionStatus(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

// Export mongoose instance for direct access if needed
export { mongoose };
