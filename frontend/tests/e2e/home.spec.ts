import { test, expect } from '@playwright/test';

test('has title and login form', async ({ page }) => {
  await page.goto('/landing');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/IntelliReview/);

  // Expect the page to have a login form or specific welcome text
  const loginButton = page.locator('[data-testid="nav-login"]').first();
  await expect(loginButton).toBeVisible();
});
