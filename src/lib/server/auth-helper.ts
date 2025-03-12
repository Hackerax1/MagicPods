import * as jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

/**
 * Utility function to verify JWT configuration
 * This can help debug JWT signature issues
 */
export function checkJwtConfig() {
  const secret = env.JWT_SECRET || process.env.JWT_SECRET;
  
  if (!secret) {
    console.error('JWT_SECRET is not defined in environment variables');
    return false;
  }
  
  try {
    // Create a test token
    const testToken = jwt.sign({ test: true }, secret);
    
    // Verify the test token
    jwt.verify(testToken, secret);
    console.log('JWT configuration is valid');
    
    return true;
  } catch (error) {
    console.error('JWT configuration test failed:', error);
    return false;
  }
}
