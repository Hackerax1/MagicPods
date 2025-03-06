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

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { runSecurityAudit, saveAuditResults } from '../dist/security/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create the security-audits directory if it doesn't exist
const auditDir = join(__dirname, '..', 'security-audits');
if (!fs.existsSync(auditDir)) {
  fs.mkdirSync(auditDir, { recursive: true });
}

// Timestamp for the audit
const timestamp = new Date().toISOString().replace(/:/g, '-');
const auditFile = join(auditDir, `audit-${timestamp}.json`);
const reportFile = join(auditDir, `report-${timestamp}.md`);

console.log('Running security audit...');

async function runAudit() {
  try {
    // Run npm audit
    console.log('\nChecking npm dependencies...');
    try {
      const npmAudit = execSync('npm audit --json', { encoding: 'utf8' });
      fs.writeFileSync(join(auditDir, `npm-audit-${timestamp}.json`), npmAudit);
      console.log('NPM audit completed.');
    } catch (error) {
      // npm audit exits with code 1 if it finds vulnerabilities
      const auditOutput = error.stdout;
      fs.writeFileSync(join(auditDir, `npm-audit-${timestamp}.json`), auditOutput);
      console.log('NPM audit found vulnerabilities (see report for details).');
    }

    // Run our custom security audit
    console.log('\nRunning application security audit...');
    const auditResult = await runSecurityAudit();
    
    // Save the audit results
    await saveAuditResults(auditResult, auditFile);
    
    // Generate a markdown report
    const report = generateMarkdownReport(auditResult);
    fs.writeFileSync(reportFile, report);
    
    console.log(`\nAudit completed. Report saved to ${reportFile}`);
    
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
    console.error('Error running security audit:', error);
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
  
  if (vulnerabilities.length === 0) {
    report += `## Vulnerabilities\n\nNo vulnerabilities found.\n\n`;
  } else {
    report += `## Vulnerabilities\n\n`;
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
runAudit();