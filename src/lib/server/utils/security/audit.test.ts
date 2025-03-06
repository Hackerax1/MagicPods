import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as auditModule from './audit';

// Import actual modules - we'll mock their functions
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Setup mocks
vi.mock('fs');
vi.mock('path');
vi.mock('child_process');

// Mock specific functions we use
vi.mocked(fs.existsSync).mockReturnValue(true);
vi.mocked(fs.readFileSync).mockReturnValue('');
vi.mocked(fs.writeFileSync).mockImplementation(() => {});
vi.mocked(fs.mkdirSync).mockImplementation(() => undefined);
vi.mocked(fs.readdirSync).mockReturnValue([]);

vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
vi.mocked(path.dirname).mockImplementation((p) => p.split('/').slice(0, -1).join('/'));

vi.mocked(execSync).mockReturnValue(Buffer.from('{}'));

describe('Security Audit Module', () => {
  describe('runSecurityAudit', () => {
    it('should run a comprehensive security audit', async () => {
      // Mock all the check functions to return predictable results
      vi.spyOn(auditModule, 'checkHardcodedSecrets').mockResolvedValue([{
        id: 'TEST-JWT-SECRET',
        severity: 'high' as 'high',
        description: 'JWT secret key hardcoded',
        affectedComponent: 'test-component',
        recommendation: 'Use environment variables',
        status: 'open'
      }]);
      
      vi.spyOn(auditModule, 'checkXssVulnerabilities').mockResolvedValue([{
        id: 'TEST-XSS',
        severity: 'medium' as 'medium',
        description: 'XSS vulnerability',
        affectedComponent: 'test-component',
        recommendation: 'Use sanitization',
        status: 'open'
      }]);
      
      vi.spyOn(auditModule, 'checkRateLimiting').mockResolvedValue([{
        id: 'TEST-RATE-LIMIT',
        severity: 'medium',
        description: 'Rate limiting needed',
        affectedComponent: 'test-component',
        recommendation: 'Add rate limiting',
        status: 'open'
      }]);
      
      vi.spyOn(auditModule, 'checkNpmVulnerabilities').mockResolvedValue([{
        id: 'TEST-NPM-VULN',
        severity: 'critical' as 'critical',
        description: 'NPM vulnerability',
        affectedComponent: 'test-package',
        recommendation: 'Update package',
        status: 'open'
      }]);
      
      vi.spyOn(auditModule, 'checkPasswordPolicy').mockResolvedValue([{
        id: 'TEST-PASSWORD-POLICY',
        severity: 'high' as 'high',
        description: 'Weak password policy',
        affectedComponent: 'test-component',
        recommendation: 'Strengthen policy',
        status: 'open'
      }]);

      const result = await auditModule.runSecurityAudit();

      // Verify audit summary
      expect(result.vulnerabilities).toHaveLength(5);
      expect(result.summary.criticalCount).toBe(1);
      expect(result.summary.highCount).toBe(2);
      expect(result.summary.mediumCount).toBe(2);
      expect(result.summary.lowCount).toBe(0);
    });
  });

  describe('saveAuditResults', () => {
    it('should save audit results to file', async () => {
      const mockResults = {
        timestamp: '2023-01-01T00:00:00.000Z',
        vulnerabilities: [{
          id: 'TEST-VULN',
          severity: 'high' as const,
          description: 'Test vulnerability',
          affectedComponent: 'test-component',
          recommendation: 'Fix it',
          status: 'open' as const
        }],
        summary: {
          totalVulnerabilities: 1,
          criticalCount: 0,
          highCount: 1,
          mediumCount: 0,
          lowCount: 0
        }
      };

      await auditModule.saveAuditResults(mockResults, 'test/file.json');

      // Verify directory creation if needed
      expect(fs.mkdirSync).toHaveBeenCalled();
      
      // Verify JSON file saved
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'test/file.json',
        expect.any(String)
      );
      
      // Verify markdown file saved
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'test/file.md',
        expect.any(String)
      );
    });
  });

  describe('generateMarkdownReport', () => {
    it('should generate proper markdown format', () => {
      const mockResults = {
        timestamp: '2023-01-01T00:00:00.000Z',
        vulnerabilities: [
          {
            id: 'CRITICAL-VULN',
            severity: 'critical' as const,
            description: 'Critical vulnerability',
            affectedComponent: 'critical-component',
            recommendation: 'Fix it immediately',
            status: 'open' as const
          },
          {
            id: 'HIGH-VULN',
            severity: 'high' as const,
            description: 'High vulnerability',
            affectedComponent: 'high-component',
            recommendation: 'Fix it soon',
            status: 'open' as const
          }
        ],
        summary: {
          totalVulnerabilities: 2,
          criticalCount: 1,
          highCount: 1,
          mediumCount: 0,
          lowCount: 0
        }
      };

      const markdown = auditModule.generateMarkdownReport(mockResults);

      // Verify markdown structure
      expect(markdown).toContain('# Security Audit Report');
      expect(markdown).toContain('## Summary');
      expect(markdown).toContain('## Vulnerabilities');
      expect(markdown).toContain('### Critical Severity');
      expect(markdown).toContain('### High Severity');
      expect(markdown).toContain('CRITICAL-VULN');
      expect(markdown).toContain('HIGH-VULN');
      expect(markdown).toContain('## Next Steps');
    });

    it('should handle empty vulnerabilities', () => {
      const mockResults = {
        timestamp: '2023-01-01T00:00:00.000Z',
        vulnerabilities: [],
        summary: {
          totalVulnerabilities: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0
        }
      };

      const markdown = auditModule.generateMarkdownReport(mockResults);

      // Verify empty vulnerabilities handling
      expect(markdown).toContain('No vulnerabilities found');
    });
  });

  describe('Individual Security Checks', () => {
    beforeEach(() => {
      // Reset mocks
      vi.resetAllMocks();
      
      // Restore common mock defaults after reset
      vi.mocked(fs.existsSync).mockReturnValue(true);
    });
    
    describe('checkHardcodedSecrets', () => {
      it('should detect hardcoded JWT secrets', async () => {
        // Mock file with hardcoded secret
        vi.mocked(fs.readFileSync).mockReturnValue(`
          const JWT_SECRET = 'supersecret';
          function signToken() {}
        `);
        
        const vulnerabilities = await auditModule.checkHardcodedSecrets();
        expect(vulnerabilities.length).toBeGreaterThan(0);
        expect(vulnerabilities[0].id).toBe('JWT-SECRET-CHECK');
      });
      
      it('should not report when no secrets found', async () => {
        // Mock file without hardcoded secret
        vi.mocked(fs.readFileSync).mockReturnValue(`
          const JWT_SECRET = process.env.JWT_SECRET;
          function signToken() {}
        `);
        
        const vulnerabilities = await auditModule.checkHardcodedSecrets();
        expect(vulnerabilities).toHaveLength(0);
      });
    });
    
    describe('checkXssVulnerabilities', () => {
      it('should detect unsanitized user input', async () => {
        // Mock directory structure with proper Dirent objects
        vi.mocked(fs.readdirSync).mockReturnValue([{
          name: 'users.ts',
          isFile: () => true,
          isDirectory: () => false,
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isSymbolicLink: () => false,
          isFIFO: () => false,
          isSocket: () => false
        } as fs.Dirent]);
        
        // Mock file with unsanitized input
        vi.mocked(fs.readFileSync).mockReturnValue(`
          function handleUserInput(req, res) {
            const name = req.body.name;
            return { name };
          }
        `);
        
        const vulnerabilities = await auditModule.checkXssVulnerabilities();
        expect(vulnerabilities.length).toBeGreaterThan(0);
      });
      
      it('should not report when sanitization is used', async () => {
        // Mock directory structure with proper Dirent objects
        vi.mocked(fs.readdirSync).mockReturnValue([{
          name: 'users.ts',
          isFile: () => true,
          isDirectory: () => false,
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isSymbolicLink: () => false,
          isFIFO: () => false,
          isSocket: () => false
        } as fs.Dirent]);
        
        // Mock file with sanitized input
        vi.mocked(fs.readFileSync).mockReturnValue(`
          import { sanitizeString } from '../utils/sanitize';
          function handleUserInput(req, res) {
            const name = sanitizeString(req.body.name);
            return { name };
          }
        `);
        
        const vulnerabilities = await auditModule.checkXssVulnerabilities();
        expect(vulnerabilities).toHaveLength(0);
      });
    });
    
    describe('checkRateLimiting', () => {
      it('should detect missing rate limiting', async () => {
        // Mock directory structure with proper Dirent objects
        vi.mocked(fs.readdirSync).mockReturnValue([{
          name: '+server.ts',
          isFile: () => true,
          isDirectory: () => false,
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isSymbolicLink: () => false,
          isFIFO: () => false,
          isSocket: () => false
        } as fs.Dirent]);
        
        // Mock file with no rate limiting
        vi.mocked(fs.readFileSync).mockReturnValue(`
          export async function POST({ request }) {
            // Handle login
          }
        `);
        
        const vulnerabilities = await auditModule.checkRateLimiting();
        expect(vulnerabilities.length).toBeGreaterThan(0);
      });
      
      it('should not report when rate limiting is used', async () => {
        // Mock directory structure with proper Dirent objects
        vi.mocked(fs.readdirSync).mockReturnValue([{
          name: '+server.ts',
          isFile: () => true,
          isDirectory: () => false,
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isSymbolicLink: () => false,
          isFIFO: () => false,
          isSocket: () => false
        } as fs.Dirent]);
        
        // Mock file with rate limiting
        vi.mocked(fs.readFileSync).mockReturnValue(`
          import { rateLimit } from '$lib/utils';
          export async function POST({ request }) {
            // Handle login with rate limiting
          }
        `);
        
        const vulnerabilities = await auditModule.checkRateLimiting();
        expect(vulnerabilities).toHaveLength(0);
      });
    });
    
    describe('checkNpmVulnerabilities', () => {
      it('should handle npm audit results', async () => {
        // Mock npm audit output
        const mockNpmOutput = JSON.stringify({
          vulnerabilities: {
            'package-a': {
              severity: 'high',
              version: '1.0.0',
              via: [{ title: 'Remote code execution' }],
              fixAvailable: { version: '1.1.0' }
            }
          }
        });
        
        vi.mocked(execSync).mockReturnValue(Buffer.from(mockNpmOutput));
        
        const vulnerabilities = await auditModule.checkNpmVulnerabilities();
        expect(vulnerabilities.length).toBeGreaterThan(0);
        expect(vulnerabilities[0].severity).toBe('high');
      });
      
      it('should handle npm audit errors', async () => {
        // Mock npm audit error
        vi.mocked(execSync).mockImplementation(() => { throw new Error('Command failed'); });
        
        const vulnerabilities = await auditModule.checkNpmVulnerabilities();
        expect(vulnerabilities.length).toBeGreaterThan(0);
        expect(vulnerabilities[0].id).toBe('NPM-AUDIT-ERROR');
      });
    });
    
    describe('checkPasswordPolicy', () => {
      it('should detect weak password policy', async () => {
        // Mock file with no password validation
        vi.mocked(fs.readFileSync).mockReturnValue(`
          export async function POST({ request }) {
            const { password } = await request.json();
            // No validation
          }
        `);
        
        const vulnerabilities = await auditModule.checkPasswordPolicy();
        expect(vulnerabilities.length).toBeGreaterThan(0);
        expect(vulnerabilities[0].id).toBe('WEAK-PASSWORD-POLICY');
      });
      
      it('should not report when password policy exists', async () => {
        // Mock file with password validation
        vi.mocked(fs.readFileSync).mockReturnValue(`
          export async function POST({ request }) {
            const { password } = await request.json();
            if (password.length < 8) {
              return { error: 'Password too short' };
            }
          }
        `);
        
        const vulnerabilities = await auditModule.checkPasswordPolicy();
        expect(vulnerabilities).toHaveLength(0);
      });
    });
  });
});