import { expect, test } from '@playwright/test';

// Test data for authentication workflow
const testUser = {
  username: `testuser_${Date.now()}`, // Ensure unique username
  email: `testuser_${Date.now()}@example.com`,
  password: 'Password123!'
};

test.describe('Authentication Workflow', () => {
  test('should register a new user', async ({ page }) => {
    // Go to home page and scroll to auth section
    await page.goto('/');
    await page.locator('#auth').scrollIntoViewIfNeeded();
    
    // Fill registration form
    await page.locator('#email').fill(testUser.email);
    await page.locator('#username').fill(testUser.username);
    await page.locator('#password').fill(testUser.password);
    await page.locator('#confirmPassword').fill(testUser.password);
    await page.locator('#terms').check();
    
    // Submit form and wait for response
    await Promise.all([
      page.waitForResponse('/api/auth'),
      page.locator('button', { hasText: 'Create Account' }).click()
    ]);
    
    // After successful registration, we should be redirected to auth page
    await expect(page).toHaveURL('/auth');
  });

  test('should fail login with incorrect credentials', async ({ page }) => {
    // Go to home page and scroll to auth section
    await page.goto('/');
    await page.locator('#auth').scrollIntoViewIfNeeded();
    
    // Try to log in with incorrect password
    await page.locator('#identifier').fill(testUser.username);
    await page.locator('#password').fill('WrongPassword123!');
    
    await page.locator('button', { hasText: 'Sign in' }).click();
    
    // Check for error message in the login form
    await expect(page.locator('.bg-red-50')).toBeVisible();
    await expect(page.locator('.bg-red-50')).toContainText(/invalid password|user not found/i);
  });

  test('should login with correct credentials', async ({ page }) => {
    // Go to home page and scroll to auth section
    await page.goto('/');
    await page.locator('#auth').scrollIntoViewIfNeeded();
    
    // Log in with correct credentials
    await page.locator('#identifier').fill(testUser.username);
    await page.locator('#password').fill(testUser.password);
    
    // Submit form and wait for navigation
    await Promise.all([
      page.waitForNavigation(),
      page.locator('button', { hasText: 'Sign in' }).click()
    ]);
    
    // After successful login, we should be redirected to the auth page
    await expect(page).toHaveURL('/auth');
    
    // Verify auth state by checking for common authenticated elements
    await expect(page.getByRole('link', { name: 'Decks' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Collection' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pods' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('should access protected routes when authenticated', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.locator('#identifier').fill(testUser.username);
    await page.locator('#password').fill(testUser.password);
    
    await Promise.all([
      page.waitForNavigation(),
      page.locator('button', { hasText: 'Sign in' }).click()
    ]);
    
    // Try accessing protected routes
    await page.goto('/auth/decks');
    await expect(page).not.toHaveURL('/'); // Should not redirect to login
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Your Decks');
    
    await page.goto('/auth/pods');
    await expect(page).not.toHaveURL('/'); // Should not redirect to login
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Your Pods');
  });

  test('should redirect to login when accessing protected routes without auth', async ({ page }) => {
    // Clear cookies to ensure no auth
    await page.context().clearCookies();
    
    // Try accessing protected route
    await page.goto('/auth/decks');
    
    // Should redirect to home/login page
    await expect(page).toHaveURL('/');
  });
});