import { expect, test } from '@playwright/test';

// Test data
const testUser = {
  username: `deckuser_${Date.now()}`,
  email: `deckuser_${Date.now()}@example.com`,
  password: 'Password123!'
};

const testDeck = {
  name: `Test Deck ${Date.now()}`,
  card: 'Lightning Bolt'
};

// Helper function to login
async function login(page) {
  await page.goto('/');
  await page.getByLabel('Username or Email:').fill(testUser.username);
  await page.getByLabel('Password:').fill(testUser.password);
  await Promise.all([
    page.waitForNavigation(),
    page.getByRole('button', { name: 'Login' }).click(),
  ]);
  // Verify login worked
  await expect(page).toHaveURL('/auth');
}

test.describe('Deck Management', () => {
  // Setup: Register a user before tests
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/');
    
    // Register user
    await page.getByLabel('Email:').fill(testUser.email);
    await page.getByLabel('Username:').fill(testUser.username);
    await page.getByLabel('Password:').fill(testUser.password);
    
    await Promise.all([
      page.waitForResponse('/api/auth'),
      page.getByRole('button', { name: 'Submit' }).click()
    ]);
    
    await page.close();
  });

  test('should navigate to decks page', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'View Your Decks' }).click();
    await expect(page).toHaveURL('/auth/decks');
    await expect(page.locator('h1')).toContainText('Your Decks');
  });

  test('should display empty state when no decks', async ({ page }) => {
    await login(page);
    await page.goto('/auth/decks');
    await expect(page.getByText('No decks found')).toBeVisible();
  });

  // Additional deck tests would include:
  // - Creating a new deck
  // - Adding cards to a deck
  // - Editing a deck
  // - Deleting a deck
  // These would require implementing UI elements and API endpoints first
});

test.describe('Card Search and Deck Building', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should search for a card', async ({ page }) => {
    // Implementation would depend on actual UI
    // This is a placeholder structure for future implementation
    await page.goto('/auth/decks/new');
    
    // Assuming there's a card search input
    await page.getByPlaceholder('Enter card name').fill(testDeck.card);
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Verify search results (depends on actual implementation)
    // await expect(page.locator('.card-result')).toBeVisible();
  });

  // Additional card/deck building tests:
  // - Adding a card to a deck
  // - Removing a card from a deck
  // - Changing card quantities
});