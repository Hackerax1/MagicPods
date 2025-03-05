/**
 * Input sanitization utility to prevent XSS attacks
 */

/**
 * Sanitizes string input to prevent XSS attacks
 * @param input - The input string to sanitize
 * @returns A sanitized string safe for rendering in HTML
 */
export function sanitizeString(input: string): string {
  if (!input) return input;

  // Replace HTML special characters with their HTML entities
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes all string properties in an object to prevent XSS attacks
 * @param obj - The object containing strings to sanitize
 * @returns A new object with all string properties sanitized
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

/**
 * Validate and sanitize email addresses
 * @param email - Email address to validate and sanitize
 * @returns Sanitized email address or empty string if invalid
 */
export function validateAndSanitizeEmail(email: string): string {
  if (!email) return '';
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return '';
  }
  
  return sanitizeString(email);
}

/**
 * Validate and sanitize usernames
 * @param username - Username to validate and sanitize
 * @returns Sanitized username or empty string if invalid
 */
export function validateAndSanitizeUsername(username: string): string {
  if (!username) return '';
  
  // Username validation: alphanumeric and underscore, 3-20 chars
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return '';
  }
  
  return sanitizeString(username);
}