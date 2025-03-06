/**
 * Test runner script for MTGSvelte3 application
 * Runs security audits and Playwright tests for specific features
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const config = {
  testGroups: {
    security: {
      description: 'Security Tests',
      command: 'npx vitest run src/lib/server/utils/security/audit.test.ts'
    },
    auth: {
      description: 'Authentication Tests',
      command: 'npx playwright test e2e/auth.test.ts'
    },
    deck: {
      description: 'Deck Management Tests',
      command: 'npx playwright test e2e/deck.test.ts'
    },
    collection: {
      description: 'Collection Management Tests',
      command: 'npx playwright test e2e/collection.test.ts'
    },
    pods: {
      description: 'Pod Management Tests',
      command: 'npx playwright test e2e/pods.test.ts'
    },
    trade: {
      description: 'Trading System Tests',
      command: 'npx playwright test e2e/trade.test.ts'
    },
    all: {
      description: 'All Tests',
      command: 'npx vitest run && npx playwright test'
    }
  }
};

/**
 * Run a specific test command and log output
 */
function runTestCommand(command, description) {
  console.log(`\n\x1b[1;34m===== Running ${description} =====\x1b[0m\n`);
  
  try {
    const output = execSync(command, { stdio: 'inherit' });
    console.log(`\n\x1b[1;32m✓ ${description} completed successfully!\x1b[0m\n`);
    return true;
  } catch (error) {
    console.error(`\n\x1b[1;31m✗ ${description} failed!\x1b[0m\n`);
    console.error(error.message);
    return false;
  }
}

/**
 * Generate test report
 */
function generateReport(results) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportDir = path.join(process.cwd(), 'test-results');
  const reportPath = path.join(reportDir, `test-report-${timestamp}.md`);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  // Generate report content
  let report = `# Test Results Report\n\n`;
  report += `**Date:** ${new Date().toLocaleString()}\n\n`;
  
  report += `## Summary\n\n`;
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r.success).length;
  
  report += `- **Total Tests:** ${totalTests}\n`;
  report += `- **Passed:** ${passedTests}\n`;
  report += `- **Failed:** ${totalTests - passedTests}\n\n`;
  
  report += `## Details\n\n`;
  
  for (const [name, result] of Object.entries(results)) {
    const icon = result.success ? '✅' : '❌';
    report += `### ${icon} ${config.testGroups[name].description}\n\n`;
    
    if (!result.success) {
      report += `**Note:** This test failed. Check the console output for error details.\n\n`;
    }
  }
  
  // Save report
  fs.writeFileSync(reportPath, report);
  console.log(`\n\x1b[1;36mTest report saved to: ${reportPath}\x1b[0m\n`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const results = {};
  
  console.log('\n\x1b[1;33m===== MTGSvelte3 Test Runner =====\x1b[0m\n');
  
  // Handle specific test groups
  if (args.length > 0) {
    for (const arg of args) {
      if (config.testGroups[arg]) {
        results[arg] = { 
          success: runTestCommand(
            config.testGroups[arg].command,
            config.testGroups[arg].description
          )
        };
      } else {
        console.error(`\x1b[31mUnknown test group: ${arg}\x1b[0m`);
        console.log('Available test groups:');
        for (const [name, group] of Object.entries(config.testGroups)) {
          console.log(`  - ${name}: ${group.description}`);
        }
        process.exit(1);
      }
    }
  } else {
    // Run trading and security tests by default
    results.trade = { 
      success: runTestCommand(
        config.testGroups.trade.command, 
        config.testGroups.trade.description
      ) 
    };
    results.security = { 
      success: runTestCommand(
        config.testGroups.security.command, 
        config.testGroups.security.description
      ) 
    };
  }
  
  // Generate and save report
  generateReport(results);
}

main().catch(error => {
  console.error('\x1b[31mError in test runner:\x1b[0m', error);
  process.exit(1);
});