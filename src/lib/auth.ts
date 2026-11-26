import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'bibi_admin_token';

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing JWT_SECRET environment variable');
    }
    return new TextEncoder().encode('dev-only-insecure-jwt-secret-change-me');
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  try {
    return bcrypt.compareSync(password, hash);
  } catch (err) {
    console.warn('[Edge Auth] bcrypt.compareSync error:', err);
    return false;
  }
}

export async function signAdminToken(payload: { id: string; username: string; role: string }): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

export async function verifyAdminToken(token: string): Promise<{ id: string; username: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as { id: string; username: string; role: string };
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyAdminToken(token);
}
