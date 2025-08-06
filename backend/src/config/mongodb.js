import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not defined in environment variables');
      process.exit(1);
    }

    const options = {
      // These are updated options for Mongoose 7+
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2,  // Minimum number of connections in the pool
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      retryWrites: true,
      writeConcern: {
        w: 'majority'
      }
    };

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed due to app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

    return mongoose.connection;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    
    // Provide more specific error messages based on error types
    if (error.name === 'MongoServerSelectionError') {
      console.error('Could not connect to MongoDB server. Please check if MongoDB is running and accessible.');
    } else if (error.name === 'MongoNetworkError') {
      console.error('Network error occurred when connecting to MongoDB. Please check your network connection.');
    } else if (error.name === 'MongoParseError') {
      console.error('Error parsing MongoDB connection string. Please check your MONGODB_URI format.');
    }
    
    process.exit(1);
  }
};

export default connectDB; 