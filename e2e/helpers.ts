/**
 * Test helpers for Playwright E2E tests
 */

import { Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a test user for e2e tests
 */
export async function createTestUser(prefix: string = 'test') {
  const timestamp = Date.now();
  const uniqueId = uuidv4().substring(0, 8);
  
  const user = {
    id: uniqueId,
    username: `${prefix}_${timestamp}`,
    email: `${prefix}_${timestamp}@example.com`,
    password: 'Password123!'
  };
  
  // You can add custom code here to programmatically create the user
  // in the database instead of using the UI registration flow
  
  return user;
}

/**
 * Clean up test user after tests are done
 */
export async function cleanupTestUser(userId: string) {
  // Add cleanup logic here (e.g., delete user from database)
  console.log(`Cleaning up test user: ${userId}`);
}

/**
 * Helper to log in a user
 */
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.getByLabel('Username or Email:').fill(email);
  await page.getByLabel('Password:').fill(password);
  
  await Promise.all([
    page.waitForNavigation(),
    page.getByRole('button', { name: 'Login' }).click()
  ]);
  
  // Verify login worked
  await page.waitForURL('/auth');
}

/**
 * Create a test deck with random name
 */
export function createTestDeck() {
  return {
    name: `Test Deck ${Date.now()}`,
    format: 'Commander',
    cards: ['Lightning Bolt', 'Island', 'Forest', 'Mountain', 'Plains', 'Swamp']
  };
}

/**
 * Add a card to collection helper
 */
export async function addCardToCollection(page: Page, cardName: string, quantity: number = 1) {
  // Navigate to collection page
  await page.goto('/auth/collection');
  
  // Search for the card
  await page.getByPlaceholder('Search for cards').fill(cardName);
  await page.getByRole('button', { name: 'Search' }).click();
  
  // Wait for search results
  await page.waitForSelector(`text="${cardName}"`);
  
  // Add to collection
  await page.getByRole('button', { name: 'Add to Collection' }).first().click();
  
  // Update quantity if needed
  if (quantity > 1) {
    await page.getByText(cardName).first().click();
    await page.getByLabel('Quantity').fill(quantity.toString());
    await page.getByRole('button', { name: 'Update' }).click();
  }
}

/**
 * Create a test pod and invite users
 */
export async function createTestPod(page: Page, podName: string, inviteUsers: string[] = []) {
  // Navigate to pods page
  await page.goto('/auth/pods');
  
  // Create pod
  await page.getByText('Create Pod').click();
  await page.fill('input[name="podName"]', podName);
  await page.click('button[type="submit"]');
  
  // Invite users if specified
  for (const username of inviteUsers) {
    await page.fill('input[id="newUser"]', username);
    await page.getByText('Add User').click();
  }
  
  return podName;
}

/**
 * Setup test trade environment
 * Creates users, adds cards to collections, and creates a pod
 */
export async function setupTradeEnvironment(page: Page, user1: any, user2: any) {
  // Login as first user
  await loginUser(page, user1.email, user1.password);
  
  // Add cards to collection
  await addCardToCollection(page, 'Lightning Bolt', 2);
  await addCardToCollection(page, 'Island', 4);
  
  // Create a pod
  const podName = await createTestPod(page, `Trade Test Pod ${Date.now()}`, [user2.username]);
  
  // Logout
  await page.getByText('Logout').click();
  
  // Login as second user
  await loginUser(page, user2.email, user2.password);
  
  // Add different cards to collection
  await addCardToCollection(page, 'Forest', 2);
  await addCardToCollection(page, 'Mountain', 4);
  
  // Accept pod invitation
  await page.goto('/auth/pods');
  await page.getByRole('button', { name: 'Accept' }).click();
  
  // Logout
  await page.getByText('Logout').click();
  
  return podName;
}