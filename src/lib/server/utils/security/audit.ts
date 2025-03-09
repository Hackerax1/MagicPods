/**
 * Security audit utility to help identify and address vulnerabilities
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Types for audit results
export type SecurityVulnerability = {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedComponent: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved';
};

export type SecurityAuditResult = {
  timestamp: string;
  vulnerabilities: SecurityVulnerability[];
  summary: {
    totalVulnerabilities: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
};

/**
 * Recursively gets all files in a directory
 */
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

/**
 * Check for hardcoded secrets in files
 */
export async function checkHardcodedSecrets(): Promise<SecurityVulnerability[]> {
  const vulnerabilities: SecurityVulnerability[] = [];
  
  // Check if JWT_SECRET is hardcoded in auth.ts
  try {
    const authPath = path.join(process.cwd(), 'src', 'lib', 'server', 'auth.ts');
    if (fs.existsSync(authPath)) {
      const content = fs.readFileSync(authPath, 'utf8');
      
      // Check for hardcoded secrets
      if (content.includes('const JWT_SECRET') || content.includes('const secret =')) {
        vulnerabilities.push({
          id: 'JWT-SECRET-CHECK',
          severity: 'high',
          description: 'JWT secret key should be stored in environment variables',
          affectedComponent: 'auth.ts',
          recommendation: 'Move JWT secret to .env file and use process.env.JWT_SECRET',
          status: 'open'
        });
      }
    }
  } catch (error) {
    console.error('Error checking for hardcoded secrets:', error);
  }
  
  return vulnerabilities;
}

/**
 * Check for XSS vulnerabilities by looking for unsanitized inputs
 */
export async function checkXssVulnerabilities(): Promise<SecurityVulnerability[]> {
  const vulnerabilities: SecurityVulnerability[] = [];
  
  // Check if sanitization is used in API endpoints
  try {
    const apiDir = path.join(process.cwd(), 'src', 'lib', 'server', 'api');
    const sanitizeImportPattern = "import { sanitizeString }";
    const sanitizeFunctionPattern = "sanitizeString(";
    
    // Find all js/ts files in the API directory
    if (fs.existsSync(apiDir)) {
      const apiFiles = getAllFiles(apiDir).filter(file => file.endsWith('.ts'));
      
      for (const filePath of apiFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(apiDir, filePath);
        
        // If the file handles user input but doesn't use sanitization
        if (content.includes('body.') || content.includes('params.') || content.includes('query.')) {
          if (!content.includes(sanitizeImportPattern) && !content.includes(sanitizeFunctionPattern)) {
            vulnerabilities.push({
              id: `XSS-RISK-${relativePath}`,
              severity: 'medium',
              description: 'User inputs should be sanitized to prevent XSS attacks',
              affectedComponent: `API endpoint: ${relativePath}`,
              recommendation: 'Use sanitizeString() from the security utils on all user inputs',
              status: 'open'
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking for XSS vulnerabilities:', error);
  }
  
  return vulnerabilities;
}

/**
 * Check for rate limiting implementation
 */
export async function checkRateLimiting(): Promise<SecurityVulnerability[]> {
  const vulnerabilities: SecurityVulnerability[] = [];
  
  // Check if rate limiting middleware is applied to API endpoints
  try {
    const routesDir = path.join(process.cwd(), 'src', 'routes', 'api');
    const rateLimitPattern = "rateLimit";
    
    if (fs.existsSync(routesDir)) {
      const apiFiles = getAllFiles(routesDir).filter(file => file.endsWith('+server.ts'));
      
      for (const filePath of apiFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(routesDir, filePath);
        
        // If the file doesn't use rate limiting
        if (content.includes('POST') || 
            content.includes('PUT') || 
            content.includes('DELETE')) {
          if (!content.includes(rateLimitPattern)) {
            vulnerabilities.push({
              id: `RATE-LIMIT-MISSING-${relativePath}`,
              severity: 'medium',
              description: 'API endpoints need rate limiting to prevent abuse',
              affectedComponent: `API endpoint: ${relativePath}`,
              recommendation: 'Apply rateLimit middleware to sensitive endpoints',
              status: 'open'
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking for rate limiting:', error);
  }
  
  return vulnerabilities;
}

/**
 * Run npm audit to check for package vulnerabilities
 */
export async function checkNpmVulnerabilities(): Promise<SecurityVulnerability[]> {
  const vulnerabilities: SecurityVulnerability[] = [];
  
  try {
    // Run npm audit in JSON format
    const npmAuditOutput = execSync('npm audit --json', { stdio: 'pipe', encoding: 'utf-8' });
    
    // Create security-audits directory if it doesn't exist
    const auditDir = path.join(process.cwd(), 'security-audits');
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }
    
    // Save raw npm audit output
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const auditFilePath = path.join(auditDir, `npm-audit-${timestamp}.json`);
    fs.writeFileSync(auditFilePath, npmAuditOutput);
    
    try {
      // Try to parse the output
      const auditResult = JSON.parse(npmAuditOutput);
      
      // Process vulnerabilities if they exist
      if (auditResult && auditResult.vulnerabilities) {
        for (const [pkg, info] of Object.entries(auditResult.vulnerabilities)) {
          const vulnInfo = info as any;
          if (vulnInfo.severity && vulnInfo.via && Array.isArray(vulnInfo.via) && vulnInfo.via.length > 0) {
            vulnerabilities.push({
              id: `NPM-VULN-${pkg}`,
              severity: vulnInfo.severity as any,
              description: `Vulnerability in package ${pkg}: ${
                (typeof vulnInfo.via[0] === 'object' && vulnInfo.via[0].title) ? 
                vulnInfo.via[0].title : 'Unknown issue'
              }`,
              affectedComponent: `npm package: ${pkg}@${vulnInfo.version || 'unknown'}`,
              recommendation: `Update ${pkg} to ${
                (vulnInfo.fixAvailable && vulnInfo.fixAvailable.version) ? 
                vulnInfo.fixAvailable.version : 'latest version'
              }`,
              status: 'open'
            });
          }
        }
      }
    } catch (parseError) {
      console.error('Error parsing npm audit output:', parseError);
      vulnerabilities.push({
        id: 'NPM-AUDIT-PARSE-ERROR',
        severity: 'low',
        description: 'Failed to parse npm audit output',
        affectedComponent: 'package.json',
        recommendation: 'Run npm audit manually to check for vulnerabilities',
        status: 'open'
      });
    }
  } catch (error) {
    console.error('Error checking for npm vulnerabilities:', error);
    // Add a notification about the audit error
    vulnerabilities.push({
      id: 'NPM-AUDIT-ERROR',
      severity: 'low',
      description: 'Failed to run npm audit check',
      affectedComponent: 'package.json',
      recommendation: 'Run npm audit manually to check for vulnerabilities',
      status: 'open'
    });
  }
  
  return vulnerabilities;
}

/**
 * Check for password policy enforcement
 */
export async function checkPasswordPolicy(): Promise<SecurityVulnerability[]> {
  const vulnerabilities: SecurityVulnerability[] = [];
  
  try {
    // Check if password policy is enforced in authentication
    const authRoutePath = path.join(process.cwd(), 'src', 'routes', 'api', 'auth', '+server.ts');
    
    if (fs.existsSync(authRoutePath)) {
      const content = fs.readFileSync(authRoutePath, 'utf8');
      
      // Check for password complexity validation
      const hasPasswordValidation = 
        content.includes('password.length') || 
        content.includes('validatePassword') ||
        content.includes('regex');
      
      if (!hasPasswordValidation) {
        vulnerabilities.push({
          id: 'WEAK-PASSWORD-POLICY',
          severity: 'high',
          description: 'No strong password policy enforcement found',
          affectedComponent: 'Authentication system',
          recommendation: 'Implement password complexity requirements (length, special chars, numbers)',
          status: 'open'
        });
      }
    }
  } catch (error) {
    console.error('Error checking password policy:', error);
  }
  
  return vulnerabilities;
}

/**
 * Runs a comprehensive security audit check on the application
 */
export async function runSecurityAudit(): Promise<SecurityAuditResult> {
  // Run all security checks
  const secretVulns = await checkHardcodedSecrets();
  const xssVulns = await checkXssVulnerabilities();
  const rateLimitVulns = await checkRateLimiting();
  const npmVulns = await checkNpmVulnerabilities();
  const passwordVulns = await checkPasswordPolicy();
  
  // Combine all vulnerabilities
  const vulnerabilities = [
    ...secretVulns,
    ...xssVulns,
    ...rateLimitVulns,
    ...npmVulns,
    ...passwordVulns
  ];

  // Calculate summary statistics
  const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
  const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
  const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
  const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;

  return {
    timestamp: new Date().toISOString(),
    vulnerabilities,
    summary: {
      totalVulnerabilities: vulnerabilities.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount
    }
  };
}

/**
 * Save audit results to a file for historical tracking
 */
export async function saveAuditResults(result: SecurityAuditResult, filePath: string): Promise<void> {
  try {
    const dir = path.dirname(filePath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save the JSON result
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
    
    // Create a markdown report for better readability
    const reportPath = filePath.replace('.json', '.md');
    const markdownReport = generateMarkdownReport(result);
    fs.writeFileSync(reportPath, markdownReport);
  } catch (error) {
    console.error('Error saving audit results:', error);
  }
}

/**
 * Generate a markdown report from audit results
 */
export function generateMarkdownReport(result: SecurityAuditResult): string {
  const { vulnerabilities, summary } = result;
  
  let markdown = `# Security Audit Report\n\n`;
  markdown += `**Date:** ${new Date(result.timestamp).toLocaleString()}\n\n`;
  
  // Summary section
  markdown += `## Summary\n\n`;
  markdown += `- **Total vulnerabilities:** ${summary.totalVulnerabilities}\n`;
  markdown += `- **Critical:** ${summary.criticalCount}\n`;
  markdown += `- **High:** ${summary.highCount}\n`;
  markdown += `- **Medium:** ${summary.mediumCount}\n`;
  markdown += `- **Low:** ${summary.lowCount}\n\n`;
  
  // Vulnerabilities section
  markdown += `## Vulnerabilities\n\n`;
  
  if (vulnerabilities.length === 0) {
    markdown += `No vulnerabilities found.\n\n`;
  } else {
    // Group by severity for better organization
    const severityOrder = ['critical', 'high', 'medium', 'low'];
    
    for (const severity of severityOrder) {
      const filteredVulns = vulnerabilities.filter(v => v.severity === severity);
      
      if (filteredVulns.length > 0) {
        markdown += `### ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity\n\n`;
        
        for (const vuln of filteredVulns) {
          markdown += `#### ${vuln.id}\n\n`;
          markdown += `- **Component:** ${vuln.affectedComponent}\n`;
          markdown += `- **Description:** ${vuln.description}\n`;
          markdown += `- **Recommendation:** ${vuln.recommendation}\n`;
          markdown += `- **Status:** ${vuln.status}\n\n`;
        }
      }
    }
  }
  
  // Recommendations section
  markdown += `## Next Steps\n\n`;
  markdown += `1. Review and address all critical and high severity issues immediately.\n`;
  markdown += `2. Schedule remediation of medium severity issues.\n`;
  markdown += `3. Address low severity issues during regular development cycles.\n`;
  
  return markdown;
}

/**
 * Runs a scheduled security audit and saves the results
 */
export async function scheduledSecurityAudit(): Promise<SecurityAuditResult> {
  const result = await runSecurityAudit();
  
  try {
    // Create security-audits directory if it doesn't exist
    const auditDir = path.join(process.cwd(), 'security-audits');
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }
    
    // Save results to a timestamped file
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filePath = path.join(auditDir, `audit-${timestamp}.json`);
    
    await saveAuditResults(result, filePath);
  } catch (error) {
    console.error('Error in scheduled security audit:', error);
  }
  
  return result;
}