import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export function validatePasswordStrength(password: string): { isValid: boolean; reason?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, reason: 'Password must be at least 8 characters long.' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, reason: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, reason: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, reason: 'Password must contain at least one digit.' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, reason: 'Password must contain at least one special character.' };
  }
  return { isValid: true };
}

/**
 * Hashes a plaintext password using bcryptjs with salt rounds = 10.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifies a plaintext password against a stored bcrypt or pbkdf2 hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;

  // Support bcrypt hashes ($2a$, $2b$, $2y$)
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    return bcrypt.compare(password, hash);
  }

  // Fallback support for legacy PBKDF2 hashes (salt:derivedKey)
  if (hash.includes(':')) {
    return new Promise((resolve) => {
      const [salt, key] = hash.split(':');
      crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
        if (err) return resolve(false);
        try {
          resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
        } catch {
          resolve(false);
        }
      });
    });
  }

  return false;
}
