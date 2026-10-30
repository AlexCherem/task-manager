import 'server-only';

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const demoUser = { id: 'demo-admin', email: 'admin@example.com' };
const demoPassword = 'Admin123!';
const cookieName = 'task_manager_session';
const sessionLifetime = 8 * 60 * 60;

function getSessionKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters.');
  }

  return new TextEncoder().encode(secret);
}

export function authenticate(email: string, password: string): boolean {
  return email === demoUser.email && password === demoPassword;
}

export async function createSession(): Promise<void> {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(demoUser.id)
    .setExpirationTime(Math.floor(Date.now() / 1000) + sessionLifetime)
    .sign(getSessionKey());

  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionLifetime,
  });
}

export async function getSession(): Promise<{
  id: string;
  email: string;
} | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;

  const key = getSessionKey();
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
      requiredClaims: ['sub', 'exp'],
    });

    return payload.sub === demoUser.id ? { ...demoUser } : null;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<{ id: string; email: string }> {
  const session = await getSession();
  if (!session) redirect('/login');

  return session;
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(cookieName);
}
