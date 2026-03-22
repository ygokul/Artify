import mongoose from 'mongoose';
import apiKeys from '@/config/api-keys.json';

// Use hardcoded configuration from api-keys.json
const MONGODB_URI = apiKeys.mongodb.uri;

if (!MONGODB_URI) {
  throw new Error('MongoDB URI is not defined in config');
}

// Global variable to store the cached connection
declare global {
  var mongoose: any; // This must be a `var` and not a `let / const`
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Connected to MongoDB successfully');
      return mongoose;
    }).catch(async (error) => {
      console.error('MongoDB Atlas connection error:', error.message);
      
      // If Atlas fails due to IP whitelist, provide helpful error message
      if (error.message.includes('IP') || error.message.includes('whitelist') || error.message.includes('servers')) {
        const helpfulError = new Error(`
MongoDB Atlas Connection Failed - IP Whitelist Issue

To fix this:
1. Go to https://cloud.mongodb.com/
2. Navigate to "Network Access" 
3. Click "Add IP Address"
4. Click "Add Current IP Address"
5. Click "Confirm"

Alternatively, for development only, you can:
- Add IP address: 0.0.0.0/0 (allows all IPs)

Original error: ${error.message}
        `);
        throw helpfulError;
      }
      
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default mongoose; 