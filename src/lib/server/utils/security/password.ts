import bcrypt from 'bcrypt';

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 * @param password Plain text password
 * @param hashedPassword Hashed password
 * @returns True if the passwords match, false otherwise
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Password validation and security utilities
 */

/**
 * Validates password strength according to security best practices
 * @param password User supplied password to validate
 * @returns {boolean} True if password meets all requirements, false otherwise
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  // Minimum length check
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  // Check for at least one digit
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }

  // Common weak passwords check (simplified)
  const commonPasswords = [
    'password', 'password123', '123456', '12345678', 'qwerty', 
    'admin', 'welcome', 'letmein', 'football', 'baseball'
  ];
  
  const lowercasePwd = password.toLowerCase();
  if (commonPasswords.some(weakPwd => lowercasePwd.includes(weakPwd))) {
    return { valid: false, message: 'Password contains common phrases that are easily guessed' };
  }

  return { valid: true, message: 'Password meets requirements' };
}

/**
 * Generates a password strength score (0-100)
 * @param password The user's password
 * @returns A score from 0-100 with higher being stronger
 */
export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  
  let score = 0;
  
  // Length contribution (up to 30 points)
  score += Math.min(30, password.length * 3);
  
  // Character variety contribution
  if (/[A-Z]/.test(password)) score += 10; // Uppercase
  if (/[a-z]/.test(password)) score += 10; // Lowercase  
  if (/[0-9]/.test(password)) score += 10; // Numbers
  if (/[^A-Za-z0-9]/.test(password)) score += 15; // Special chars
  
  // Variety bonus - if all character types are present
  if (/[A-Z]/.test(password) && 
      /[a-z]/.test(password) && 
      /[0-9]/.test(password) && 
      /[^A-Za-z0-9]/.test(password)) {
    score += 15;
  }
  
  // Penalize repetitive patterns
  const repetitivePattern = /(.)\1{2,}/;
  if (repetitivePattern.test(password)) {
    score -= 10;
  }
  
  // Ensure score is within 0-100 range
  return Math.max(0, Math.min(100, score));
}
