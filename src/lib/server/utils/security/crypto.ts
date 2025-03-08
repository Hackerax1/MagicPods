import crypto from 'crypto';

/**
 * Generate a random string of specified length
 * @param length Length of the random string
 * @returns Random string
 */
export function generateRandomString(length: number): string {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

/**
 * Generate a random token
 * @returns Random token
 */
export function generateToken(): string {
  return generateRandomString(32);
}

/**
 * Hash a string using SHA-256
 * @param data String to hash
 * @returns Hashed string
 */
export function hashString(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}
