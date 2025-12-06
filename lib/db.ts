import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;


/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing in environment variables');
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  }

  if (cached.conn) {
    if (mongoose.connection.readyState === 1) {
      // console.log('✅ Using cached MongoDB connection');
      return cached.conn;
    }
    console.warn('⚠️ Cached connection exists but not ready. Reconnecting...');
    cached.promise = null; // Reset promise to force new connection
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true, // Enable buffering to handle temporary disconnects
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // Increased to 10s
      socketTimeoutMS: 45000,
    };

    console.log('⏳ Connecting to MongoDB...', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('✅ New MongoDB connection established');
      return mongoose;
    }).catch(err => {
      console.error('❌ MongoDB connection failed:', err);
      cached.promise = null; // Reset promise on failure
      throw err;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ Error awaiting MongoDB connection:', e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;
