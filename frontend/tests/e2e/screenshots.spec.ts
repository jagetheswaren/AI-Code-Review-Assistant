import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/jaget/.gemini/antigravity-ide/brain/f88f1de9-eceb-4752-acca-8200b5a01edb';

const mockAuth = async (page) => {
  await page.route('**/api/me', route => route.fulfill({ status: 200, json: { id: 1, username: 'jagetheswaren', email: 'jaget@example.com' } }));
  await page.route('**/api/notifications*', route => route.fulfill({ status: 200, json: { unread_count: 0, notifications: [] } }));
  await page.route('**/api/github/status', route => route.fulfill({ status: 200, json: { connected: true, username: 'jagetheswaren', github_username: 'jagetheswaren', method: 'pat' } }));
  await page.route('**/api/github/repos*', route => route.fulfill({ status: 200, json: { repositories: [] } }));
  await page.route('**/api/ai/status', route => route.fulfill({
    status: 200,
    json: {
      ai_available: true,
      provider: 'groq',
      model: 'openai/gpt-oss-120b',
      reachable: true
    }
  }));
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'real-token');
  });
};

test.describe('Visual Snapshot Tour', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('capture Dashboard screenshot', async ({ page }) => {
    await page.route('**/api/dashboard', route => route.fulfill({ status: 200, json: {
      health_score: 92,
      statistics: {
        total_scans: 14,
        avg_issues: 3.2,
        by_severity: { critical: 1, high: 2, medium: 5, low: 8, info: 12 },
        by_type: { security: 4, code_smell: 10, performance: 6, best_practice: 8 },
        risk_distribution: { low: 8, medium: 4, high: 2, critical: 1 }
      },
      recent_scans: [
        {
          id: 'scan-1',
          request_id: '1e4a2048-29c0-4e5e-85f1-a9ccf85892bc',
          timestamp: new Date().toISOString(),
          summary: { file_path: 'auth/jwt_handler.py', total_issues: 3, overall_risk: 'high', health_score: 85 }
        }
      ]
    }}));
    await page.route('**/api/trends?*', route => route.fulfill({ status: 200, json: {
      trends: [
        { date: '2026-10-05', total_issues: 12, critical: 1, high: 2, medium: 4, low: 5 },
        { date: '2026-10-08', total_issues: 8, critical: 0, high: 1, medium: 3, low: 4 },
        { date: '2026-10-11', total_issues: 3, critical: 0, high: 0, medium: 1, low: 2 }
      ]
    }}));
    await page.goto('/dashboard');
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dashboard_screen.png'), fullPage: false });
  });

  test('capture AI Code Review workspace screenshot', async ({ page }) => {
    await page.goto('/review');
    await expect(page.locator('h1', { hasText: 'New Analysis' })).toBeVisible();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'review_screen.png'), fullPage: false });
  });

  test('capture GitHub Integration screenshot', async ({ page }) => {
    await page.goto('/github');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'github_screen.png'), fullPage: false });
  });

  test('capture Security Analysis screenshot', async ({ page }) => {
    await page.goto('/security');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'security_screen.png'), fullPage: false });
  });

  test('capture History screenshot', async ({ page }) => {
    await page.goto('/history');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'history_screen.png'), fullPage: false });
  });
});
