import { test, expect } from '@playwright/test';
import { loginUser, createTestUser, cleanupTestUser } from './helpers';

test.describe('Trade System', () => {
  let user1;
  let user2;

  test.beforeAll(async () => {
    user1 = await createTestUser('trader1');
    user2 = await createTestUser('trader2');
  });

  test.afterAll(async () => {
    await cleanupTestUser(user1.id);
    await cleanupTestUser(user2.id);
  });

  test('complete trade workflow', async ({ page }) => {
    // Login as first user
    await loginUser(page, user1.email, user1.password);
    
    // Navigate to pod
    await page.goto('/auth/pods');
    await page.getByText('Create Pod').click();
    await page.fill('input[name="podName"]', 'Trade Test Pod');
    await page.click('button[type="submit"]');
    
    // Invite second user to pod
    await page.fill('input[id="newUser"]', user2.username);
    await page.getByText('Add User').click();
    
    // Create a trade
    await page.getByText('Manage Trades').click();
    await page.getByText('Create New Trade').click();
    
    // Select trade participant
    await page.getByLabel(user2.username).check();
    
    // Add cards to trade (assuming cards exist in collection)
    await page.getByText('Select Cards').click();
    await page.getByText('Add to Trade').first().click();
    
    // Submit trade
    await page.getByText('Create Trade').click();
    
    // Verify trade appears in notifications
    await expect(page.getByText('You\'ve created a new trade')).toBeVisible();
    
    // Logout first user
    await page.getByText('Logout').click();
    
    // Login as second user
    await loginUser(page, user2.email, user2.password);
    
    // Check trade notification
    await expect(page.getByText('You\'ve been invited to a new trade')).toBeVisible();
    
    // Accept trade
    await page.getByText('View Trade').click();
    await page.getByText('Accept Trade').click();
    
    // Verify trade status updated
    await expect(page.getByText('accepted')).toBeVisible();
    
    // Check trade history
    await page.goto('/auth/pods/trades');
    await expect(page.getByText('Trade History')).toBeVisible();
    const tradeItem = page.getByText('accepted').first();
    await expect(tradeItem).toBeVisible();
  });

  test('trade notifications are marked as read', async ({ page }) => {
    await loginUser(page, user1.email, user1.password);
    await page.goto('/auth/pods/trades');
    
    // Click on notification
    const notification = page.getByText('Trade status updated').first();
    await notification.click();
    
    // Verify notification is marked as read
    await expect(page.locator('.notification.read')).toBeVisible();
  });

  test('multiway trade with multiple participants', async ({ page }) => {
    const user3 = await createTestUser('trader3');
    
    try {
      await loginUser(page, user1.email, user1.password);
      await page.goto('/auth/pods/trades');
      
      // Create multiway trade
      await page.getByText('Create New Trade').click();
      await page.getByLabel(user2.username).check();
      await page.getByLabel(user3.username).check();
      
      // Add cards to trade
      await page.getByText('Select Cards').click();
      await page.getByText('Add to Trade').first().click();
      
      // Submit trade
      await page.getByText('Create Trade').click();
      
      // Verify both users received notifications
      await loginUser(page, user2.email, user2.password);
      await expect(page.getByText('You\'ve been invited to a new trade')).toBeVisible();
      
      await loginUser(page, user3.email, user3.password);
      await expect(page.getByText('You\'ve been invited to a new trade')).toBeVisible();
    } finally {
      await cleanupTestUser(user3.id);
    }
  });
});