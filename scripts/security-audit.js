#!/usr/bin/env node

/**
 * Security audit script
 * 
 * This script runs a comprehensive security audit on the application and generates a report.
 * It can be run manually or scheduled to run periodically (e.g., through a cron job).
 * 
 * Usage:
 *   node scripts/security-audit.js
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

import { scheduledSecurityAudit } from '../src/lib/server/utils/security/audit.js';

// Create the security-audits directory if it doesn't exist
const auditDir = path.join(__dirname, '..', 'security-audits');
if (!fs.existsSync(auditDir)) {
  fs.mkdirSync(auditDir, { recursive: true });
}

// Timestamp for the audit
const timestamp = new Date().toISOString().replace(/:/g, '-');
const auditFile = path.join(auditDir, `audit-${timestamp}.json`);
const reportFile = path.join(auditDir, `report-${timestamp}.md`);

console.log('Running security audit...');

// Audit npm dependencies
try {
  console.log('Checking npm dependencies...');
  const npmAudit = execSync('npm audit --json').toString();
  fs.writeFileSync(path.join(auditDir, `npm-audit-${timestamp}.json`), npmAudit);
  console.log('NPM audit completed.');
} catch (error) {
  console.log('NPM audit found vulnerabilities (see report for details).');
}

// Import our custom audit module (using dynamic import since this is a Node.js script)
async function runCustomAudit() {
  try {
    // We need to use dynamic import since we're in a CommonJS module
    // and our audit.ts file is a TypeScript ESM module
    const { runSecurityAudit } = await import('../src/lib/server/utils/security/audit.js');
    
    // Run our custom security audit
    console.log('Running application security audit...');
    const auditResult = await runSecurityAudit();
    
    // Save the audit results
    fs.writeFileSync(auditFile, JSON.stringify(auditResult, null, 2));
    
    // Generate a markdown report
    const report = generateMarkdownReport(auditResult);
    fs.writeFileSync(reportFile, report);
    
    console.log(`Audit completed. Report saved to ${reportFile}`);
    
    // Display summary in console
    console.log('\nSecurity Audit Summary:');
    console.log(`Total vulnerabilities: ${auditResult.summary.totalVulnerabilities}`);
    console.log(`  Critical: ${auditResult.summary.criticalCount}`);
    console.log(`  High: ${auditResult.summary.highCount}`);
    console.log(`  Medium: ${auditResult.summary.mediumCount}`);
    console.log(`  Low: ${auditResult.summary.lowCount}`);
    
    // Return non-zero exit code if critical or high vulnerabilities exist
    if (auditResult.summary.criticalCount > 0 || auditResult.summary.highCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running custom security audit:', error);
    process.exit(1);
  }
}

/**
 * Generate a markdown report from the audit results
 */
function generateMarkdownReport(auditResult) {
  const { timestamp, vulnerabilities, summary } = auditResult;
  
  let report = `# Security Audit Report\n\n`;
  report += `**Date:** ${new Date(timestamp).toLocaleString()}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- **Total vulnerabilities:** ${summary.totalVulnerabilities}\n`;
  report += `- **Critical:** ${summary.criticalCount}\n`;
  report += `- **High:** ${summary.highCount}\n`;
  report += `- **Medium:** ${summary.mediumCount}\n`;
  report += `- **Low:** ${summary.lowCount}\n\n`;
  
  report += `## Vulnerabilities\n\n`;
  
  if (vulnerabilities.length === 0) {
    report += `No vulnerabilities found.\n\n`;
  } else {
    vulnerabilities.forEach(vuln => {
      report += `### ${vuln.id}\n\n`;
      report += `- **Severity:** ${vuln.severity}\n`;
      report += `- **Status:** ${vuln.status}\n`;
      report += `- **Component:** ${vuln.affectedComponent}\n`;
      report += `- **Description:** ${vuln.description}\n`;
      report += `- **Recommendation:** ${vuln.recommendation}\n\n`;
    });
  }
  
  report += `## Recommendations\n\n`;
  report += `1. Address any critical and high severity vulnerabilities immediately.\n`;
  report += `2. Schedule remediation for medium and low severity issues.\n`;
  report += `3. Run security audits regularly as part of your development process.\n`;
  
  return report;
}

// Run the audit
runCustomAudit();

async function runAudit() {
  try {
    const result = await scheduledSecurityAudit();
    console.log('Security Audit Results:');
    console.log('------------------------');
    console.log(`Total Vulnerabilities: ${result.summary.totalVulnerabilities}`);
    console.log(`Critical: ${result.summary.criticalCount}`);
    console.log(`High: ${result.summary.highCount}`);
    console.log(`Medium: ${result.summary.mediumCount}`);
    console.log(`Low: ${result.summary.lowCount}`);
    console.log('\nDetailed vulnerabilities:');
    result.vulnerabilities.forEach(vuln => {
      console.log(`\n[${vuln.severity.toUpperCase()}] ${vuln.id}`);
      console.log(`Component: ${vuln.affectedComponent}`);
      console.log(`Description: ${vuln.description}`);
      console.log(`Recommendation: ${vuln.recommendation}`);
    });
  } catch (error) {
    console.error('Error running security audit:', error);
    process.exit(1);
  }
}

runAudit();