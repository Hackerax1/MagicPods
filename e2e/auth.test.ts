import { expect, test } from '@playwright/test';

// Test data for authentication workflow
const testUser = {
  username: `testuser_${Date.now()}`, // Ensure unique username
  email: `testuser_${Date.now()}@example.com`,
  password: 'Password123!'
};

test.describe('Authentication Workflow', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/');

    // Fill registration form with correct selectors
    await page.getByRole('textbox', { name: 'Email Address' }).fill(testUser.email);
    await page.getByRole('textbox', { name: 'Username' }).fill(testUser.username);
    await page.locator('#register-password').fill(testUser.password);
    await page.locator('#register-confirm-password').fill(testUser.password);
    await page.getByRole('checkbox', { name: /I agree to the Terms/ }).check();
    
    await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/api/auth') && 
        response.request().method() === 'POST'
      ),
      page.getByRole('button', { name: 'Create Account' }).click()
    ]);
    
    // After registration, user stays on home page
    await expect(page).toHaveURL('/');
  });

  test('should fail login with incorrect credentials', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('textbox', { name: 'Username or Email' }).fill(testUser.username);
    await page.locator('#login-password').fill('WrongPassword123!');
    
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Check for error message
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/invalid password|login failed/i);
  });

  test('should login with correct credentials', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('textbox', { name: 'Username or Email' }).fill(testUser.username);
    await page.locator('#login-password').fill(testUser.password);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.getByRole('button', { name: 'Sign in' }).click()
    ]);
    
    // After login, we should be on the auth path
    await expect(page).toHaveURL('/auth');
    
    // Verify navigation is available
    await expect(page.getByRole('link', { name: 'Decks' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Collection' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pods' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('should access protected routes when authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Login first
    await page.getByRole('textbox', { name: 'Username or Email' }).fill(testUser.username);
    await page.locator('#login-password').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Wait for login to complete
    await page.waitForURL('/auth');
    
    // Try accessing protected routes
    await page.goto('/auth/decks');
    await expect(page.getByRole('heading', { name: /Your Decks/i })).toBeVisible();
    
    await page.goto('/auth/pods');
    await expect(page.getByRole('heading', { name: /Your Pods/i })).toBeVisible();
  });

  test('should redirect to login when accessing protected routes without auth', async ({ page }) => {
    await page.context().clearCookies();
    
    // Try accessing protected route
    await page.goto('/auth/decks');
    
    // Should be redirected to home/login
    await expect(page).toHaveURL('/');
  });
});