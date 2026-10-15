import { createHash, randomBytes } from 'crypto';
import { db } from '@/lib/db';
import { hashPassword, validatePasswordStrength } from './password';

export const RESET_TOKEN_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Initiates a password reset request.
 * Generates an unhashed token for delivery to the user and stores the SHA-256 hash.
 */
export async function createPasswordResetToken(
  email: string
): Promise<{ rawToken: string; expiresAt: Date } | null> {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user || !user.isActive) {
    // Return null silently to prevent user enumeration
    return null;
  }

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRATION_MS);

  // Invalidate any existing unused reset tokens for this user
  await db.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  return { rawToken, expiresAt };
}

/**
 * Resets user password using a valid raw token.
 * Executes atomically in a transaction and invalidates all existing sessions.
 */
export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const strength = validatePasswordStrength(newPassword);
  if (!strength.isValid) {
    return { success: false, error: strength.message };
  }

  const tokenHash = hashToken(rawToken);

  const resetRecord = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetRecord) {
    return { success: false, error: 'Invalid or expired password reset token.' };
  }

  if (resetRecord.usedAt || resetRecord.expiresAt.getTime() <= Date.now()) {
    return { success: false, error: 'This password reset token has expired or already been used.' };
  }

  const newHash = await hashPassword(newPassword);

  // Atomic transaction
  await db.$transaction(async (tx) => {
    // 1. Update password
    await tx.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash: newHash },
    });

    // 2. Mark token as used
    await tx.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    });

    // 3. Destroy all existing active sessions for security
    await tx.session.deleteMany({
      where: { userId: resetRecord.userId },
    });

    // 4. Log security audit
    await tx.auditLog.create({
      data: {
        actorId: resetRecord.userId,
        action: 'PASSWORD_RESET',
        entityType: 'AUTH',
        entityId: resetRecord.userId,
      },
    });
  });

  return { success: true };
}
