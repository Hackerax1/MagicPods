import { db } from '$lib/server/database';
import { users } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { generateRandomString } from './crypto';
import { hashPassword } from './password';
import { sendEmail } from './email';

// Store tokens with expiration times (in memory for simplicity, but should be in DB for production)
interface ResetToken {
  token: string;
  email: string;
  expiresAt: number;
}

// In a real production app, these should be stored in a database
const resetTokens: ResetToken[] = [];

// Token expiration time (1 hour)
const TOKEN_EXPIRATION = 60 * 60 * 1000;

/**
 * Generate a password reset token for a user
 */
export function generateResetToken(email: string): string {
  // Clean up expired tokens
  cleanupExpiredTokens();
  
  // Generate a random token
  const token = generateRandomString(32);
  
  // Store the token with the user's email and expiration time
  resetTokens.push({
    token,
    email,
    expiresAt: Date.now() + TOKEN_EXPIRATION
  });
  
  return token;
}

/**
 * Verify a password reset token
 * @returns The email associated with the token if valid, null otherwise
 */
export async function verifyResetToken(token: string): Promise<string | null> {
  // Clean up expired tokens
  cleanupExpiredTokens();
  
  // Find the token
  const resetToken = resetTokens.find(t => t.token === token);
  
  if (!resetToken) {
    return null;
  }
  
  // Check if the token is still valid
  if (resetToken.expiresAt < Date.now()) {
    // Remove the expired token
    const index = resetTokens.indexOf(resetToken);
    resetTokens.splice(index, 1);
    return null;
  }
  
  // Verify that the user exists
  const user = await db.select().from(users).where(eq(users.email, resetToken.email)).limit(1);
  
  if (user.length === 0) {
    return null;
  }
  
  return resetToken.email;
}

/**
 * Update a user's password
 */
export async function updateUserPassword(email: string, newPassword: string): Promise<void> {
  // Hash the new password
  const hashedPassword = await hashPassword(newPassword);
  
  // Update the user's password in the database
  await db.update(users)
    .set({ password: hashedPassword })
    .where(eq(users.email, email));
  
  // Remove any reset tokens for this user
  const tokensToRemove = resetTokens.filter(t => t.email === email);
  tokensToRemove.forEach(token => {
    const index = resetTokens.indexOf(token);
    resetTokens.splice(index, 1);
  });
}

/**
 * Send a password reset email to a user
 */
export async function sendResetEmail(email: string, token: string): Promise<void> {
  // Check if the user exists
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (user.length === 0) {
    // Don't reveal that the email doesn't exist for security reasons
    // Just pretend we sent the email
    return;
  }
  
  const resetUrl = `${process.env.PUBLIC_BASE_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  
  const subject = 'Reset Your MTGSvelte Password';
  const text = `
    Hello ${user[0].username},
    
    You recently requested to reset your password for your MTGSvelte account. Click the link below to reset it:
    
    ${resetUrl}
    
    If you did not request a password reset, please ignore this email or contact support if you have questions.
    
    This password reset link is only valid for 1 hour.
    
    Thanks,
    The MTGSvelte Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Reset Your MTGSvelte Password</h2>
      <p>Hello ${user[0].username},</p>
      <p>You recently requested to reset your password for your MTGSvelte account. Click the button below to reset it:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
      </p>
      <p>If the button above doesn't work, you can also click on this link or copy and paste it into your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
      <p><strong>This password reset link is only valid for 1 hour.</strong></p>
      <p>Thanks,<br>The MTGSvelte Team</p>
    </div>
  `;
  
  await sendEmail(email, subject, text, html);
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  const expiredIndices: number[] = [];
  
  resetTokens.forEach((token, index) => {
    if (token.expiresAt < now) {
      expiredIndices.push(index);
    }
  });
  
  // Remove expired tokens in reverse order to avoid index shifting issues
  for (let i = expiredIndices.length - 1; i >= 0; i--) {
    resetTokens.splice(expiredIndices[i], 1);
  }
}
