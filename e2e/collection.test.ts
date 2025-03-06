import { test, expect } from '@playwright/test';
import { loginUser, createTestUser, cleanupTestUser } from './helpers';

test.describe('Collection Management', () => {
  let testUser;

  test.beforeAll(async () => {
    testUser = await createTestUser('collectionuser');
  });

  test.afterAll(async () => {
    await cleanupTestUser(testUser.id);
  });

  test('should add cards to collection', async ({ page }) => {
    await loginUser(page, testUser.email, testUser.password);
    
    // Navigate to collection page
    await page.goto('/auth/collection');
    await expect(page.locator('h1')).toContainText('Your Collection');
    
    // Search for a card
    await page.getByPlaceholder('Search for cards').fill('Lightning Bolt');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Wait for search results
    const cardResult = page.getByText('Lightning Bolt').first();
    await expect(cardResult).toBeVisible();
    
    // Add card to collection
    await page.getByRole('button', { name: 'Add to Collection' }).first().click();
    
    // Verify card was added (checking for success message or updated card count)
    await expect(page.getByText('Card added to collection')).toBeVisible();
    
    // Verify collection count updated
    await page.getByRole('link', { name: 'Collection' }).click();
    await expect(page.getByText('Lightning Bolt')).toBeVisible();
  });

  test('should remove cards from collection', async ({ page }) => {
    await loginUser(page, testUser.email, testUser.password);
    await page.goto('/auth/collection');
    
    // Find the card in collection
    const cardInCollection = page.getByText('Lightning Bolt').first();
    await expect(cardInCollection).toBeVisible();
    
    // Remove the card
    await page.getByRole('button', { name: 'Remove' }).first().click();
    
    // Confirm removal
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    // Verify card was removed
    await expect(page.getByText('Card removed from collection')).toBeVisible();
    
    // Refresh and check that the card is gone
    await page.reload();
    await expect(page.getByText('No cards found')).toBeVisible();
  });

  test('should update card quantity', async ({ page }) => {
    await loginUser(page, testUser.email, testUser.password);
    
    // First add a card
    await page.goto('/auth/collection');
    await page.getByPlaceholder('Search for cards').fill('Island');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('button', { name: 'Add to Collection' }).first().click();
    
    // Update quantity
    await page.getByText('Island').first().click();
    await page.getByLabel('Quantity').fill('4');
    await page.getByRole('button', { name: 'Update' }).click();
    
    // Verify quantity updated
    await expect(page.getByText('Quantity updated')).toBeVisible();
    await page.reload();
    await expect(page.getByText('Island (4)')).toBeVisible();
  });
});