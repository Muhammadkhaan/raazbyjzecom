/**
 * In-memory sliding window rate limiter for login and password recovery.
 * Provides protection against automated credential stuffing and brute-force attacks.
 */

interface RateLimitRecord {
  attempts: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  keyPrefix: string;
  maxAttempts: number;
  windowMs: number;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {
    keyPrefix: 'login',
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const key = `${options.keyPrefix}:${identifier.toLowerCase()}`;
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || record.resetAt <= now) {
    // New window
    memoryStore.set(key, {
      attempts: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: options.maxAttempts - 1,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (record.attempts >= options.maxAttempts) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(retryAfter, 1),
    };
  }

  record.attempts += 1;
  const retryAfter = Math.ceil((record.resetAt - now) / 1000);
  return {
    allowed: true,
    remaining: options.maxAttempts - record.attempts,
    retryAfterSeconds: Math.max(retryAfter, 1),
  };
}

export function resetRateLimit(identifier: string, keyPrefix = 'login'): void {
  const key = `${keyPrefix}:${identifier.toLowerCase()}`;
  memoryStore.delete(key);
}
