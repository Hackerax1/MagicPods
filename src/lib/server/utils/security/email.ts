import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import nodemailer from 'nodemailer';

const JWT_SECRET = env.JWT_SECRET || 'fallback-secret-for-development-only';

// Create a transporter for sending emails
// For development, we'll use a test account from Ethereal
// In production, you would use a real email service
let transporter: nodemailer.Transporter;

async function createTransporter() {
  if (env.NODE_ENV === 'production') {
    // Production email configuration
    // Replace with your actual email service credentials
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST || 'smtp.example.com',
      port: parseInt(env.EMAIL_PORT || '587'),
      secure: env.EMAIL_SECURE === 'true',
      auth: {
        user: env.EMAIL_USER || '',
        pass: env.EMAIL_PASSWORD || '',
      },
    });
  } else {
    // For development, use Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
}

// Initialize the transporter
createTransporter().catch(console.error);

export function generateResetToken(email: string): string {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
}

export async function sendResetEmail(email: string, token: string): Promise<void> {
  const baseUrl = env.PUBLIC_BASE_URL || 'http://localhost:5173';
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  
  // Email content
  const subject = 'Reset Your MTGSvelte Password';
  const text = `
    Hello,
    
    You recently requested to reset your password for your MTGSvelte account. Click the link below to reset it:
    
    ${resetLink}
    
    If you did not request a password reset, please ignore this email or contact support if you have questions.
    
    This password reset link is only valid for 1 hour.
    
    Thanks,
    The MTGSvelte Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Reset Your MTGSvelte Password</h2>
      <p>Hello,</p>
      <p>You recently requested to reset your password for your MTGSvelte account. Click the button below to reset it:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
      </p>
      <p>If the button above doesn't work, you can also click on this link or copy and paste it into your browser:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
      <p><strong>This password reset link is only valid for 1 hour.</strong></p>
      <p>Thanks,<br>The MTGSvelte Team</p>
    </div>
  `;
  
  await sendEmail(email, subject, text, html);
}

/**
 * Send an email
 */
export async function sendEmail(
  to: string, 
  subject: string, 
  text: string, 
  html: string
): Promise<void> {
  if (!transporter) {
    await createTransporter();
  }
  
  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM || '"MTGSvelte" <noreply@mtgsvelte.com>',
      to,
      subject,
      text,
      html,
    });
    
    // For development, log the test URL
    if (env.NODE_ENV !== 'production') {
      console.log('Email sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}
