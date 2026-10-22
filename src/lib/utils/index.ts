import mongoose, { Mongoose } from "mongoose";

import { MONGO_URI_DEV, MONGO_URI_PROD, ENCRYPTION_KEY } from '$app/env/private';
import { dev } from '$app/env';

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const isDevServer = dev;
let cached: MongooseCache = globalThis.mongooseCache || {
  conn: null,
  promise: null,
};

if (!globalThis.mongooseCache) {
  globalThis.mongooseCache = cached;
}

const getMongoUri = (): string => {
  const uri = isDevServer ? MONGO_URI_DEV : MONGO_URI_PROD;

  if (!uri) {
    throw new Error(
      "Database URI is not defined in environment variables (MONGO_URI_DEV / MONGO_URI_PROD).",
    );
  }

  return uri;
};

export const connectDataBase = async (): Promise<Mongoose> => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise || mongoose.connection.readyState !== 1) {
    const uri = getMongoUri();

    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      } as mongoose.ConnectOptions)
      .then((m: Mongoose): Mongoose => {
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error: unknown) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }

  return cached.conn;
};

export const getJwtSecretKey = (): Uint8Array => {
  const secret = ENCRYPTION_KEY;

  if (!secret) {
    throw new Error("ENCRYPTION_KEY is not defined di file .env");
  }

  return new TextEncoder().encode(secret);
};
