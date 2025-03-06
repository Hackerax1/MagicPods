import { test, expect } from '@playwright/test';
import { loginUser, createTestUser, cleanupTestUser } from './helpers';

test.describe('Pod Management', () => {
  let user1;
  let user2;

  test.beforeAll(async () => {
    user1 = await createTestUser('poduser1');
    user2 = await createTestUser('poduser2');
  });

  test.afterAll(async () => {
    await cleanupTestUser(user1.id);
    await cleanupTestUser(user2.id);
  });

  test('should create a new pod', async ({ page }) => {
    await loginUser(page, user1.email, user1.password);
    
    // Navigate to pods page
    await page.goto('/auth/pods');
    await expect(page.locator('h1')).toContainText('Your Pods');
    
    // Create a new pod
    await page.getByText('Create Pod').click();
    await page.fill('input[name="podName"]', 'Test Pod');
    await page.click('button[type="submit"]');
    
    // Verify pod was created
    await expect(page.getByText('Pod created successfully')).toBeVisible();
    await expect(page.getByText('Test Pod')).toBeVisible();
  });

  test('should invite a user to a pod', async ({ page }) => {
    await loginUser(page, user1.email, user1.password);
    await page.goto('/auth/pods');
    
    // Click on the pod
    await page.getByText('Test Pod').click();
    
    // Invite user2
    await page.fill('input[id="newUser"]', user2.username);
    await page.getByText('Add User').click();
    
    // Verify invitation was sent
    await expect(page.getByText('User invited successfully')).toBeVisible();
    
    // Logout and login as user2
    await page.getByText('Logout').click();
    await loginUser(page, user2.email, user2.password);
    
    // Check for pod invitation
    await page.goto('/auth/pods');
    await expect(page.getByText('Pod Invitations')).toBeVisible();
    await expect(page.getByText('Test Pod')).toBeVisible();
    
    // Accept invitation
    await page.getByRole('button', { name: 'Accept' }).click();
    
    // Verify pod is now listed in user2's pods
    await expect(page.getByText('Test Pod')).toBeVisible();
  });

  test('should display pod members', async ({ page }) => {
    await loginUser(page, user1.email, user1.password);
    await page.goto('/auth/pods');
    
    // Click on the pod
    await page.getByText('Test Pod').click();
    
    // Verify both users are listed in the pod
    await expect(page.getByText(user1.username)).toBeVisible();
    await expect(page.getByText(user2.username)).toBeVisible();
  });

  test('should leave a pod', async ({ page }) => {
    await loginUser(page, user2.email, user2.password);
    await page.goto('/auth/pods');
    
    // Click on the pod
    await page.getByText('Test Pod').click();
    
    // Leave the pod
    await page.getByRole('button', { name: 'Leave Pod' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    // Verify pod is no longer listed
    await expect(page.getByText('You left the pod successfully')).toBeVisible();
    await expect(page.getByText('Test Pod')).not.toBeVisible();
  });

  test('should delete a pod', async ({ page }) => {
    await loginUser(page, user1.email, user1.password);
    await page.goto('/auth/pods');
    
    // Click on the pod
    await page.getByText('Test Pod').click();
    
    // Delete the pod
    await page.getByRole('button', { name: 'Delete Pod' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    // Verify pod is deleted
    await expect(page.getByText('Pod deleted successfully')).toBeVisible();
    await expect(page.getByText('Test Pod')).not.toBeVisible();
  });
});