import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import nodemailer from 'nodemailer';

const JWT_SECRET = env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

// Email configuration
const EMAIL_HOST = env.EMAIL_HOST || 'smtp.example.com';
const EMAIL_PORT = parseInt(env.EMAIL_PORT || '587');
const EMAIL_USER = env.EMAIL_USER || 'noreply@yourapp.com';
const EMAIL_PASS = env.EMAIL_PASSWORD || '';
const EMAIL_FROM = env.EMAIL_FROM || 'MTG App <noreply@yourapp.com>';
const APP_URL = env.APP_URL || 'http://localhost:5173';

// Create transport once
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationLink = `${APP_URL}/auth/verify-email?token=${token}`;
  
  // In development or testing, log instead of sending actual email
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Verification link for ${email}: ${verificationLink}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: 'Verify Your Email',
      text: `Welcome to MTG App! Please verify your email by clicking this link: ${verificationLink}\n\nIf you did not create an account, please ignore this email.`,
      html: `
        <h1>Welcome to MTG App!</h1>
        <p>Please verify your email by clicking the button below:</p>
        <a href="${verificationLink}" style="display:inline-block;background:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;margin:20px 0;">Verify Email</a>
        <p>If you did not create an account, please ignore this email.</p>
      `
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

export function generateResetToken(email: string): string {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
}

export function verifyResetToken(token: string): { email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    return decoded;
  } catch (error) {
    console.error('Error verifying reset token:', error);
    return null;
  }
}

export async function sendResetEmail(email: string, token: string): Promise<void> {
  const resetLink = `${APP_URL}/reset-password?token=${token}`;
  
  // In development or testing, log instead of sending actual email
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Password reset link for ${email}: ${resetLink}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: 'Reset Your Password',
      text: `You requested a password reset. Click this link to reset your password: ${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you did not request a password reset, please ignore this email.`,
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <a href="${resetLink}" style="display:inline-block;background:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;margin:20px 0;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      `
    });
  } catch (error) {
    console.error('Error sending reset email:', error);
    throw new Error('Failed to send reset email');
  }
}
