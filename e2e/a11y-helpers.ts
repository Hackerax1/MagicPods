/**
 * Accessibility testing helpers for Playwright E2E tests
 */

import { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Run accessibility tests on the current page
 * @param page - Playwright Page object
 * @param name - Name of the test (used for reporting)
 * @param options - Optional configuration for axe
 */
export async function checkA11y(page: Page, name: string, options?: {
  includedImpacts?: Array<'minor' | 'moderate' | 'serious' | 'critical'>,
  rules?: {
    [key: string]: 'off' | 'warn' | 'error'
  }
}) {
  // Configure axe
  let builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .options({
      reporter: 'v2',
    });
  
  // Apply additional options if provided
  if (options?.includedImpacts) {
    builder = builder.options({
      resultTypes: options.includedImpacts.map(impact => {
        return impact === 'minor' ? 'passes' : 'violations';
      })
    });
  }
  
  if (options?.rules) {
    const axeRules: { [key: string]: { enabled: boolean } } = {};
    
    for (const [ruleName, ruleValue] of Object.entries(options.rules)) {
      axeRules[ruleName] = {
        enabled: ruleValue !== 'off'
      };
    }
    
    builder = builder.options({ rules: axeRules });
  }
  
  // Run the analysis
  const results = await builder.analyze();
  
  // Generate report file path for CI reporting
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportName = `a11y-report-${name}-${timestamp}.json`;
  
  // Log results for CI reporting
  console.log(`A11Y Test Results for ${name}:
    - Violations: ${results.violations.length}
    - Passes: ${results.passes.length}
    - Incomplete: ${results.incomplete.length}
    - Inapplicable: ${results.inapplicable.length}
  `);
  
  // Return results for use in tests
  return results;
}
