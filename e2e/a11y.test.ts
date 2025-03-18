import { test, expect } from '@playwright/test';
import { checkA11y } from './a11y-helpers';
import { createTestUser, loginUser } from './helpers';

// Tests critical pages for accessibility compliance
test.describe('Accessibility Tests', () => {
  // User for testing authenticated pages
  let testUser: any;

  test.beforeAll(async () => {
    testUser = createTestUser('a11y');
    // Note: In a real environment, you would create this user in the database
  });

  test('Home page meets accessibility standards', async ({ page }) => {
    await page.goto('/');
    
    const results = await checkA11y(page, 'home-page');
    
    // Assert no serious or critical violations
    const seriousOrCriticalViolations = results.violations.filter(
      v => v.impact === 'serious' || v.impact === 'critical'
    );
    
    expect(seriousOrCriticalViolations).toEqual([]);
  });

  test('Login form meets accessibility standards', async ({ page }) => {
    await page.goto('/');
    
    const results = await checkA11y(page, 'login-form');
    
    // Log detailed info about violations for fixing
    if (results.violations.length > 0) {
      console.log('Accessibility violations in login form:');
      results.violations.forEach(v => {
        console.log(`- ${v.id} (${v.impact}): ${v.help}`);
      });
    }
    
    // Assert no serious or critical violations
    const seriousOrCriticalViolations = results.violations.filter(
      v => v.impact === 'serious' || v.impact === 'critical'
    );
    
    expect(seriousOrCriticalViolations).toEqual([]);
  });

  test('Registration form meets accessibility standards', async ({ page }) => {
    await page.goto('/');
    // Navigate to registration form - adjust this based on your app's navigation
    await page.getByText('Register').click();
    
    const results = await checkA11y(page, 'registration-form');
    
    // Assert no serious or critical violations
    const seriousOrCriticalViolations = results.violations.filter(
      v => v.impact === 'serious' || v.impact === 'critical'
    );
    
    expect(seriousOrCriticalViolations).toEqual([]);
  });

  test('Deck builder meets accessibility standards', async ({ page }) => {
    // Login first - we'll need to mock this properly in production
    // For demo, we can use the page object model pattern
    await loginUser(page, testUser.email, testUser.password);
    
    // Navigate to deck builder
    await page.goto('/auth/decks');
    
    const results = await checkA11y(page, 'deck-builder');
    
    // Assert no serious or critical violations
    const seriousOrCriticalViolations = results.violations.filter(
      v => v.impact === 'serious' || v.impact === 'critical'
    );
    
    expect(seriousOrCriticalViolations).toEqual([]);
  });

  // Add more tests for other critical pages in your application
});