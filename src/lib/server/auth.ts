import type { RequestEvent } from '@sveltejs/kit';

interface UserJWT {
  userId: string;
  username: string;
  email: string;
  iat: number;
  exp: number;
}
import { eq, or } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { user } from '../server/db/schema';
import { env } from '$env/dynamic/private';

// JWT Settings
const JWT_SECRET = env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}
const JWT_EXPIRES_IN = '30d';
export const AUTH_COOKIE_NAME = 'auth-token';

// JWT Helper functions
function generateJWT(payload: any) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function validateToken(token: string): UserJWT | null {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return null;
    }
    
    // Verify the token with the secret
    const decoded = jwt.verify(token, JWT_SECRET) as UserJWT;
    return decoded;
  } catch (error) {
    console.error('JWT validation error:', error);
    return null;
  }
}

export function setAuthCookie(event: RequestEvent, token: string) {
  event.cookies.set(AUTH_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });
}

export function deleteAuthCookie(event: RequestEvent) {
  event.cookies.delete(AUTH_COOKIE_NAME, {
    path: '/'
  });
}

export async function register(email: string, username: string, password: string) {
  try {
    // Check if user already exists
    const existingUsers = await db
      .select()
      .from(user)
      .where(or(eq(user.email, email), eq(user.username, username)))
      .limit(1);

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.email === email) {
        throw new Error('Email already in use');
      }
      if (existingUser.username === username) {
        throw new Error('Username already taken');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      email,
      username,
      password: hashedPassword
    };
    
    await db.insert(user).values(newUser);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export async function login(identifier: string, password: string, event: RequestEvent) {
  try {
    // Find user by email or username
    const foundUsers = await db
      .select()
      .from(user)
      .where(or(eq(user.email, identifier), eq(user.username, identifier)))
      .limit(1);
      
    if (foundUsers.length === 0) {
      throw new Error('User not found');
    }
    
    const foundUser = foundUsers[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, foundUser.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }
    
    // Generate JWT token with all required user fields
    const token = generateJWT({
      userId: foundUser.id,
      username: foundUser.username,
      email: foundUser.email
    });
    
    // Set the auth cookie
    setAuthCookie(event, token);
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = foundUser;
    return { 
      success: true,
      user: userWithoutPassword 
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function logout(event: RequestEvent) {
  deleteAuthCookie(event);
  return { success: true };
}
