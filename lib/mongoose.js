import mongoose from 'mongoose';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global variable to hold the connection
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connection options to improve reliability and performance
 */
const options = {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 10, // Keep connection pool smaller for M0 clusters
  minPoolSize: 1,  // Maintain at least one connection
  maxIdleTimeMS: 60000, // Close idle connections after 1 minute
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: process.env.NODE_ENV !== 'production',
  retryWrites: true,
  retryReads: true,
};

/**
 * Connect to MongoDB and cache the connection
 */
export async function connectToDatabase() {
  if (cached.conn) {
    // Use existing connection
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = options;

    // Set up connection promise
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('MongoDB connected successfully');
        return mongoose;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        cached.promise = null; // Reset the promise on error
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

/**
 * Disconnect from MongoDB - useful for testing
 */
export async function disconnectFromDatabase() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('MongoDB disconnected');
  }
}

/**
 * Get a model by name, ensuring it's only compiled once
 */
export function getModel(modelName, schema) {
  // Return the model if it exists
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }
  
  // Otherwise, create and return the model
  return mongoose.model(modelName, schema);
}

// Set up connection event handlers for better debugging
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Handle process termination gracefully
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose disconnected on app termination');
  process.exit(0);
});