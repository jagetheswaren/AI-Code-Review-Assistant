import { test, expect } from '@playwright/test';

const mockAuth = async (page) => {
  await page.route('**/api/me', route => route.fulfill({ status: 200, json: { id: 1, username: 'testuser' } }));
  await page.route('**/api/notifications*', route => route.fulfill({ status: 200, json: { unread_count: 0, notifications: [] } }));
  await page.route('**/api/github/status', route => route.fulfill({ status: 200, json: { connected: false } }));
  await page.route('**/api/ai/status', route => route.fulfill({ status: 200, json: { ai_available: true, provider: 'groq' } }));
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'fake-token');
  });
};

test.describe('Review & History Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
  });

  test('should load the new review page', async ({ page }) => {
    await page.goto('/review');
    await expect(page.locator('h1', { hasText: 'New Analysis' })).toBeVisible();
    
    // Should have a code editor or text area
    await expect(page.locator('[data-testid="code-editor"]')).toBeVisible();
    
    // Should have an analyze button
    await expect(page.locator('[data-testid="run-review"]')).toBeVisible();
  });

  test('should load the history page', async ({ page }) => {
    await page.route('**/api/history*', route => route.fulfill({ status: 200, json: { scans: [], total_pages: 1, total_scans: 0 } }));
    await page.goto('/history');
    await expect(page.locator('h1', { hasText: 'Scan History' })).toBeVisible();
    
    // Either a list of items or an empty state
    await expect(page.locator('text=No scan history').or(page.locator('[data-testid="history-row"]'))).toBeVisible();
  });
});
