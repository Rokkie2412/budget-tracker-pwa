import crypto from 'node:crypto';

import { hashSync } from 'bcrypt-ts';
import { jwtVerify } from "jose";
import mongoose, { Mongoose } from "mongoose";

import { dev } from '$app/env';
import { JWT_KEY, MONGO_URI_DEV, MONGO_URI_PROD, STATIC_SALT } from '$app/env/private';

import { ENC_ALGORITHM } from '@/constants'
import type { AuthPayload} from '@/types'

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
  const secret = JWT_KEY;

  if (!secret) {
    throw new Error("JWT_KEY is not defined di file .env");
  }

  return new TextEncoder().encode(secret);
};

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENC_ALGORITHM, Buffer.from(process.env.ENCRYPTION_KEY!), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
};

export const decrypt = (text: string): string => {
  try {
    const [ivHex, encryptedText] = text.split(':');
    if (!ivHex || !encryptedText) return text;

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ENC_ALGORITHM, Buffer.from(process.env.ENCRYPTION_KEY!), iv);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return '[Data Protected]';
  }
};

export const verifyAuth = async (
  request: Request,
): Promise<{ payload: AuthPayload | null; errorResponse: Response | null }> => {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      payload: null,
      errorResponse: Response.json(
        { message: "Unauthorized: Missing or invalid Bearer token." },
        { status: 401 },
      ),
    };
  }

  const token = authHeader.substring(7);

  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey);

    return {
      payload: payload as unknown as AuthPayload,
      errorResponse: null,
    };
  } catch {
    return {
      payload: null,
      errorResponse: Response.json(
        { message: "Unauthorized: Token is invalid" },
        { status: 401 },
      ),
    };
  }
};

export const hashUserId = (userId: string): string => {
  if (!STATIC_SALT) {
    throw new Error("STATIC_SALT is not defined in environment variables");
  }

  const trimmed = userId.trim();

  if (trimmed.startsWith("$2a$") || trimmed.startsWith("$2b$")) {
    return trimmed;
  }

  return hashSync(trimmed, STATIC_SALT);
};