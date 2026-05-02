import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'bhl_super_secret_jwt_key_2024_brotherhood';

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const cookie = req.cookies.get('bhl_token');
  return cookie?.value || null;
}

export function getUserFromRequest(req: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

// Helper for Server Components
import { cache } from 'react';
import { cookies } from 'next/headers';
import { User } from '@/models/User';
import { connectDB } from './db';

export const getServerUser = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('bhl_token')?.value;
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;
  
  try {
    await connectDB();
    const user = await User.findById(payload.userId).lean();
    if (!user) return null;
    return JSON.parse(JSON.stringify(user)); // ensure it's plain object
  } catch {
    return null;
  }
});

// Admin Authorization with Live DB Check (avoids stale cookie role bug)
import { unstable_cache } from 'next/cache';

export const getCachedUserRole = unstable_cache(
  async (userId: string) => {
    await connectDB();
    const user = await User.findById(userId).select('role').lean();
    return user?.role || 'user';
  },
  ['user-role-check'],
  { revalidate: 30, tags: ['auth'] } // Cache role for 30s
);

export async function verifyAdmin(req: NextRequest): Promise<{ userId: string; role: string } | null> {
  const payload = getUserFromRequest(req);
  if (!payload) return null;

  // Fetch the LATEST role from DB to avoid stale cookie issues
  const currentRole = await getCachedUserRole(payload.userId);
  
  if (currentRole === 'admin' || currentRole === 'superadmin') {
    return { userId: payload.userId, role: currentRole };
  }

  return null;
}

export async function verifySuperAdmin(req: NextRequest): Promise<{ userId: string; role: string } | null> {
  const admin = await verifyAdmin(req);
  if (admin?.role === 'superadmin') {
    return admin;
  }
  return null;
}
