import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || process.env.bhl_MONGODB_URI;

if (!MONGODB_URI && process.env.NODE_ENV === 'production') {
  throw new Error(
    'Please define the MONGODB_URI or bhl_MONGODB_URI environment variable inside your deployment settings (Vercel).'
  );
}


const connectionString = MONGODB_URI || 'mongodb://localhost:27017/bhl_platform_db';


interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(connectionString, {
      bufferCommands: false,
    }).catch((err) => {
      cached.promise = null; // reset so next request retries
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
