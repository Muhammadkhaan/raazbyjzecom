import { getCurrentUser, type AuthenticatedUser } from './session';

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Checks if a given user role satisfies the required roles.
 */
export function isAuthorized(userRole: string, allowedRoles: string[]): boolean {
  if (userRole === ROLES.SUPER_ADMIN) return true; // Super admin possesses universal access
  return allowedRoles.includes(userRole);
}

/**
 * Server guard for Server Actions and API routes.
 * Throws an Error with 401 or 403 status if unauthorized.
 */
export async function requireUser(allowedRoles?: string[]): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('UNAUTHORIZED: Authentication is required to access this resource.');
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!isAuthorized(user.role, allowedRoles)) {
      throw new Error('FORBIDDEN: Insufficient permissions for this operation.');
    }
  }

  return user;
}

/**
 * Convenience guard strictly requiring SUPER_ADMIN or STAFF roles.
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  return requireUser([ROLES.SUPER_ADMIN, ROLES.STAFF]);
}
