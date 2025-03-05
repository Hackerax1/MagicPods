import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateToken, generateJWT, setAuthCookie, deleteAuthCookie } from './auth';
import jwt from 'jsonwebtoken';

// Mock the JWT library
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mocked-jwt-token'),
    verify: vi.fn()
  }
}));

// Mock the database
vi.mock('$lib/server/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue([{ id: 'test-user-id', username: 'testuser', email: 'test@example.com' }])
      })
    })
  }
}));

describe('Auth Module', () => {
  describe('JWT Functions', () => {
    it('should generate a JWT token', () => {
      const payload = { userId: 'test-user-id' };
      const token = generateJWT(payload);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        payload, 
        expect.any(String), 
        { expiresIn: '30d' }
      );
      expect(token).toBe('mocked-jwt-token');
    });
  });

  describe('validateToken', () => {
    let mockEvent;
    
    beforeEach(() => {
      mockEvent = {
        cookies: {
          get: vi.fn().mockReturnValue('valid-token')
        }
      };
      
      // Reset mocks
      vi.resetAllMocks();
    });
    
    it('should return null if no token is present', async () => {
      mockEvent.cookies.get.mockReturnValue(null);
      const result = await validateToken(mockEvent);
      expect(result).toBeNull();
    });

    it('should return user data if token is valid', async () => {
      // Mock JWT verification
      jwt.verify.mockReturnValue({ userId: 'test-user-id' });
      
      const result = await validateToken(mockEvent);
      
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect(result).toEqual({
        id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com'
      });
    });

    it('should return null if token verification fails', async () => {
      // Mock JWT verification to throw an error
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      const result = await validateToken(mockEvent);
      
      expect(result).toBeNull();
    });
  });

  describe('Cookie Management', () => {
    it('should set auth cookie with correct options', () => {
      const mockEvent = {
        cookies: {
          set: vi.fn()
        }
      };
      
      setAuthCookie(mockEvent, 'test-token');
      
      expect(mockEvent.cookies.set).toHaveBeenCalledWith(
        expect.any(String),
        'test-token',
        expect.objectContaining({
          path: '/',
          httpOnly: true,
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        })
      );
    });

    it('should delete auth cookie', () => {
      const mockEvent = {
        cookies: {
          delete: vi.fn()
        }
      };
      
      deleteAuthCookie(mockEvent);
      
      expect(mockEvent.cookies.delete).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          path: '/'
        })
      );
    });
  });
});