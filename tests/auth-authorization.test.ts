import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password';
import { createSession, validateSessionToken, destroySession } from '@/lib/auth/session';
import { isAuthorized, ROLES } from '@/lib/auth/rbac';
import { checkRateLimit, resetRateLimit } from '@/lib/auth/rate-limiter';
import { createPasswordResetToken, resetPasswordWithToken } from '@/lib/auth/password-reset';

describe('Database Foundation & Authentication / Authorization Suite', () => {
  const testCustomerEmail = `customer_${Date.now()}@test.com`;
  const testAdminEmail = `admin_${Date.now()}@test.com`;
  const testPassword = 'Password123!';
  let customerId = '';
  let adminId = '';

  beforeAll(async () => {
    // 1. Create test customer
    const customerHash = await hashPassword(testPassword);
    const customer = await db.user.create({
      data: {
        email: testCustomerEmail,
        name: 'Test Customer',
        role: ROLES.CUSTOMER,
        passwordHash: customerHash,
        isActive: true,
      },
    });
    customerId = customer.id;

    // 2. Create test admin
    const adminHash = await hashPassword(testPassword);
    const admin = await db.user.create({
      data: {
        email: testAdminEmail,
        name: 'Store Super Admin',
        role: ROLES.SUPER_ADMIN,
        passwordHash: adminHash,
        isActive: true,
      },
    });
    adminId = admin.id;
  });

  afterAll(async () => {
    // Cleanup test users
    await db.user.deleteMany({
      where: {
        email: {
          in: [testCustomerEmail, testAdminEmail],
        },
      },
    }).catch(() => {});
  });

  describe('1. Password Hashing & Complexity Validation', () => {
    it('validates password strength rules', () => {
      expect(validatePasswordStrength('short').isValid).toBe(false);
      expect(validatePasswordStrength('alllowercase1').isValid).toBe(false);
      expect(validatePasswordStrength('ALLUPPERCASE1').isValid).toBe(false);
      expect(validatePasswordStrength('NoNumbersHere!').isValid).toBe(false);
      expect(validatePasswordStrength('ValidPass123!').isValid).toBe(true);
    });

    it('generates secure hash and verifies matching password', async () => {
      const hash = await hashPassword('SecretKey123!');
      expect(hash).not.toBe('SecretKey123!');
      const matches = await verifyPassword('SecretKey123!', hash);
      expect(matches).toBe(true);
      const fails = await verifyPassword('WrongPassword', hash);
      expect(fails).toBe(false);
    });
  });

  describe('2. Session Lifecycle & Validation', () => {
    let sessionToken = '';

    it('creates database-backed session with metadata', async () => {
      const { token, session } = await createSession(customerId, {
        ipAddress: '127.0.0.1',
        userAgent: 'Vitest/Test-Agent',
      });

      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes hex
      expect(session.userId).toBe(customerId);
      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
      sessionToken = token;
    });

    it('validates active session and loads user details', async () => {
      const validated = await validateSessionToken(sessionToken);
      expect(validated).not.toBeNull();
      expect(validated?.user.id).toBe(customerId);
      expect(validated?.user.email).toBe(testCustomerEmail);
      expect(validated?.user.role).toBe(ROLES.CUSTOMER);
    });

    it('destroys session cleanly upon logout', async () => {
      await destroySession(sessionToken);
      const validatedAfterDestroy = await validateSessionToken(sessionToken);
      expect(validatedAfterDestroy).toBeNull();
    });

    it('rejects invalid or non-existent session tokens', async () => {
      const invalid = await validateSessionToken('completely_fake_token_12345');
      expect(invalid).toBeNull();
    });
  });

  describe('3. Role-Based Access Control (RBAC)', () => {
    it('allows Super-Admin access to administrative permissions', () => {
      expect(isAuthorized(ROLES.SUPER_ADMIN, [ROLES.SUPER_ADMIN])).toBe(true);
      expect(isAuthorized(ROLES.SUPER_ADMIN, [ROLES.STAFF])).toBe(true);
      expect(isAuthorized(ROLES.SUPER_ADMIN, [ROLES.CUSTOMER])).toBe(true);
    });

    it('STRICTLY BLOCKS customer accounts from accessing admin functionality', () => {
      expect(isAuthorized(ROLES.CUSTOMER, [ROLES.SUPER_ADMIN])).toBe(false);
      expect(isAuthorized(ROLES.CUSTOMER, [ROLES.SUPER_ADMIN, ROLES.STAFF])).toBe(false);
    });

    it('allows customer access to customer endpoints', () => {
      expect(isAuthorized(ROLES.CUSTOMER, [ROLES.CUSTOMER])).toBe(true);
    });
  });

  describe('4. Rate Limiting Protection', () => {
    const testIp = '192.168.1.100';

    it('allows requests within threshold and blocks upon exceeding limit', () => {
      resetRateLimit(testIp, 'test_suite');

      for (let i = 0; i < 5; i++) {
        const check = checkRateLimit(testIp, {
          keyPrefix: 'test_suite',
          maxAttempts: 5,
          windowMs: 60000,
        });
        expect(check.allowed).toBe(true);
      }

      // 6th attempt should be blocked
      const blocked = checkRateLimit(testIp, {
        keyPrefix: 'test_suite',
        maxAttempts: 5,
        windowMs: 60000,
      });
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe('5. Password Recovery Workflow', () => {
    let rawResetToken = '';

    it('generates a secure password reset token for valid user', async () => {
      const reset = await createPasswordResetToken(testCustomerEmail);
      expect(reset).not.toBeNull();
      expect(reset?.rawToken).toBeDefined();
      expect(reset?.expiresAt.getTime()).toBeGreaterThan(Date.now());
      rawResetToken = reset!.rawToken;
    });

    it('silently ignores reset requests for non-existent emails', async () => {
      const reset = await createPasswordResetToken('nonexistent_user_999@test.com');
      expect(reset).toBeNull();
    });

    it('atomically resets password and invalidates previous sessions', async () => {
      // 1. Create a session before reset
      const { token: oldSessionToken } = await createSession(customerId);

      // 2. Perform reset
      const newPassword = 'NewSecretPassword456!';
      const result = await resetPasswordWithToken(rawResetToken, newPassword);
      expect(result.success).toBe(true);

      // 3. Old session must now be invalidated/deleted
      const oldSession = await validateSessionToken(oldSessionToken);
      expect(oldSession).toBeNull();

      // 4. User should now match new password
      const updatedUser = await db.user.findUnique({ where: { id: customerId } });
      const matchesNew = await verifyPassword(newPassword, updatedUser!.passwordHash);
      expect(matchesNew).toBe(true);

      // 5. Reusing the same reset token must fail
      const reuse = await resetPasswordWithToken(rawResetToken, 'AnotherPass123!');
      expect(reuse.success).toBe(false);
    });
  });
});
