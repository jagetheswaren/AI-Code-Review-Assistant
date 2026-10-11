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

test.describe('Responsive UI', () => {
  const viewports = [
    { width: 360, height: 800, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1440, height: 900, name: 'Desktop' },
  ];

  for (const viewport of viewports) {
    test(`Landing page renders correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/landing');
      
      // Ensure the hero section is visible and fits the screen
      await expect(page.locator('[data-testid="hero-title"]')).toBeVisible();
      
      // The body shouldn't have horizontal scroll
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(overflow).toBeFalsy();
    });
    
    test(`Dashboard renders correctly on ${viewport.name}`, async ({ page }) => {
      await mockAuth(page);
      await page.route('**/api/dashboard', route => route.fulfill({ status: 200, json: { recent_scans: [] } }));
      await page.route('**/api/trends?*', route => route.fulfill({ status: 200, json: { trends: [] } }));
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/dashboard');
      
      // Dashboard title should be visible
      await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();
    });
  }
});
