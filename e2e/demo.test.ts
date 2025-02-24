import { expect, test } from '@playwright/test';

const user = {
  username: 'testuser',
  email: 'testuser@example.com',
  password: 'password123'
};

test('home page has expected h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});

test('register a new user', async ({ page }) => {
  await page.goto('/');
  await page.fill('input#username', user.username);
  await page.fill('input#email', user.email);
  await page.fill('input#password', user.password);
  await page.click('button[type="submit"]');
  await expect(page.locator('.success-message')).toHaveText('User registered successfully!');
});
