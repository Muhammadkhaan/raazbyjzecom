import crypto from 'crypto';
import { db, User, Session } from '@/lib/db';

export const SESSION_COOKIE_NAME = 'laam_session_token';
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 Days

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'STAFF' | 'CUSTOMER';
  isActive: boolean;
}

export async function createSession(
  userId: string,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<{ token: string; session: Session }> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await db.session.create({
    data: {
      token,
      userId,
      expiresAt,
      ipAddress: metadata?.ipAddress || null,
      userAgent: metadata?.userAgent || null,
    },
  });

  return { token, session };
}

export async function validateSessionToken(
  token: string
): Promise<{ session: Session; user: AuthenticatedUser } | null> {
  if (!token || typeof token !== 'string') return null;

  const session = await db.session.findUnique({
    where: { token },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { token } }).catch(() => {});
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || !user.isActive) return null;

  return {
    session,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    },
  };
}

export async function destroySession(token: string): Promise<void> {
  if (!token) return;
  await db.session.deleteMany({ where: { token } }).catch(() => {});
}

export async function getCurrentUser(token?: string): Promise<AuthenticatedUser | null> {
  if (!token) return null;
  const result = await validateSessionToken(token);
  return result ? result.user : null;
}
