import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME, type AuthenticatedUser } from '@/lib/auth/session';
import { isAuthorized, ROLES } from '@/lib/auth/rbac';
import type { Session } from '@/lib/db';

export interface AdminAuthResult {
  user: AuthenticatedUser;
  session: Session;
}

export async function getAdminSession(req: NextRequest): Promise<AdminAuthResult | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const auth = await validateSessionToken(token);
  if (!auth) return null;

  if (!isAuthorized(auth.user.role, [ROLES.SUPER_ADMIN, ROLES.STAFF])) {
    return null;
  }

  return auth;
}

export function unauthorizedResponse(message = 'UNAUTHORIZED: Authentication is required.') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = 'FORBIDDEN: Administrative privileges required.') {
  return NextResponse.json({ error: message }, { status: 403 });
}
