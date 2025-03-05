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
    
    // Fill registration form
    await page.getByLabel('Email:').fill(testUser.email);
    await page.getByLabel('Username:').fill(testUser.username);
    await page.getByLabel('Password:').fill(testUser.password);
    
    // Submit form and wait for navigation
    await Promise.all([
      page.waitForResponse('/api/auth'),
      page.getByRole('button', { name: 'Submit' }).click()
    ]);
    
    // After successful registration, we should be redirected to the login page
    await expect(page).toHaveURL('/');
  });

  test('should fail login with incorrect credentials', async ({ page }) => {
    await page.goto('/');
    
    // Try to log in with incorrect password
    await page.getByLabel('Username or Email:').fill(testUser.username);
    await page.getByLabel('Password:').fill('WrongPassword123!');
    
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Check for error message
    await expect(page.locator('.bg-red-100')).toBeVisible();
    await expect(page.locator('.bg-red-100')).toContainText(/invalid password|user not found/i);
  });

  test('should login with correct credentials', async ({ page }) => {
    await page.goto('/');
    
    // Log in with correct credentials
    await page.getByLabel('Username or Email:').fill(testUser.username);
    await page.getByLabel('Password:').fill(testUser.password);
    
    // Submit form and wait for navigation
    await Promise.all([
      page.waitForNavigation(),
      page.getByRole('button', { name: 'Login' }).click()
    ]);
    
    // After successful login, we should be redirected to the auth page
    await expect(page).toHaveURL('/auth');
    
    // Verify that user profile elements are visible
    await expect(page.locator('h1')).toContainText('Your Profile');
    await expect(page.getByText(testUser.username)).toBeVisible();
  });

  test('should access protected routes when authenticated', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.getByLabel('Username or Email:').fill(testUser.username);
    await page.getByLabel('Password:').fill(testUser.password);
    
    await Promise.all([
      page.waitForNavigation(),
      page.getByRole('button', { name: 'Login' }).click()
    ]);
    
    // Try accessing protected routes
    await page.goto('/auth/decks');
    await expect(page).not.toHaveURL('/'); // Should not redirect to login
    await expect(page.locator('h1')).toContainText('Your Decks');
    
    await page.goto('/auth/pods');
    await expect(page).not.toHaveURL('/'); // Should not redirect to login
    await expect(page.locator('h1')).toContainText('Your Pods');
  });

  test('should redirect to login when accessing protected routes without auth', async ({ page }) => {
    // Clear cookies to ensure no auth
    await page.context().clearCookies();
    
    // Try accessing protected route
    await page.goto('/auth/decks');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/');
  });
});