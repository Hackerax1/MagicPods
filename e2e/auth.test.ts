import { expect, test } from '@playwright/test';

// Test data for authentication workflow
const testUser = {
  username: `testuser_${Date.now()}`, // Ensure unique username
  email: `testuser_${Date.now()}@example.com`,
  password: 'Password123!'
};

test.describe('Authentication Workflow', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/#auth');
    
    // Fill registration form in the first panel
    await page.locator('div.w-full.md\\:w-1\\/2').first().getByLabel('Email Address').fill(testUser.email);
    await page.locator('div.w-full.md\\:w-1\\/2').first().getByLabel('Username').fill(testUser.username);
    await page.locator('div.w-full.md\\:w-1\\/2').first().getByLabel('Password').fill(testUser.password);
    await page.locator('div.w-full.md\\:w-1\\/2').first().getByLabel('Confirm Password').fill(testUser.password);
    await page.locator('div.w-full.md\\:w-1\\/2').first().getByLabel(/I agree to the/).check();
    
    // Submit form and wait for response
    await Promise.all([
      page.waitForResponse('/api/auth'),
      page.locator('div.w-full.md\\:w-1\\/2').first().getByRole('button', { name: 'Create Account' }).click()
    ]);
    
    // After successful registration, we should stay on the same page to log in
    await expect(page).toHaveURL('/#auth');
  });

  test('should fail login with incorrect credentials', async ({ page }) => {
    await page.goto('/#auth');
    
    // Try to log in with incorrect password in the second panel
    await page.locator('div.w-full.md\\:w-1\\/2').nth(1).getByLabel('Username or Email').fill(testUser.username);
    await page.locator('div.w-full.md\\:w-1\\/2').nth(1).getByLabel('Password').fill('WrongPassword123!');
    
    await page.locator('div.w-full.md\\:w-1\\/2').nth(1).getByRole('button', { name: 'Sign in' }).click();
    
    // Check for error message in the login form
    await expect(page.locator('div.w-full.md\\:w-1\\/2').nth(1).locator('.bg-red-100')).toBeVisible();
    await expect(page.locator('div.w-full.md\\:w-1\\/2').nth(1).locator('.bg-red-100')).toContainText(/invalid password|user not found/i);
  });

  test('should login with correct credentials', async ({ page }) => {
    await page.goto('/#auth');
    
    // Log in with correct credentials in the second panel
    await page.locator('div.w-full.md\\:w-1\\/2').nth(1).getByLabel('Username or Email').fill(testUser.username);
    await page.locator('div.w-full.md\\:w-1\\/2').nth(1).getByLabel('Password').fill(testUser.password);
    
    // Submit form and wait for navigation
    await Promise.all([
      page.waitForNavigation(),
      page.locator('div.w-full.md\\:w-1\\/2').nth(1).getByRole('button', { name: 'Sign in' }).click()
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
    await page.goto('/#auth');
    await page.locator('div.w-full.md\\:w-1\\/2').nth(1).getByLabel('Username or Email').fill(testUser.username);
    await page.locator('div.w-full.md\\:w-1\\/2').nth(1).getByLabel('Password').fill(testUser.password);
    
    await Promise.all([
      page.waitForNavigation(),
      page.locator('div.w-full.md\\:w-1\\/2').nth(1).getByRole('button', { name: 'Sign in' }).click()
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