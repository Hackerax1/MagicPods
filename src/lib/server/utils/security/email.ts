import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

const JWT_SECRET = env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export function generateResetToken(email: string): string {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
}

export async function sendResetEmail(email: string, token: string): Promise<void> {
  const resetLink = `https://yourapp.com/reset-password?token=${token}`;
  // Implement your email sending logic here
  console.log(`Send email to ${email} with reset link: ${resetLink}`);
}
