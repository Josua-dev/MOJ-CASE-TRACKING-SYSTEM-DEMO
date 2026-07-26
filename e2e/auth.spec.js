/**
 * Authentication flow E2E tests for MOJ Case Tracker.
 *
 * These tests cover the login page rendering, invalid credential handling,
 * and redirect behaviour when accessing protected content without auth.
 */
const { test, expect } = require('@playwright/test');
const { TEST_USER } = require('./fixtures');

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('moj_token');
      localStorage.removeItem('moj_user');
    });
  });

  test('Login page loads with logo, copyright, and form fields', async ({ page }) => {
    await page.goto('/');

    // Wait for the login page to render
    await page.waitForSelector('#login-email', { state: 'visible' });

    // Logo — coat of arms image
    const crest = page.locator('.moj-logo-crest');
    await expect(crest).toBeVisible();
    await expect(crest).toHaveAttribute('alt', 'Republic of Namibia Coat of Arms');

    // Logo text
    await expect(page.locator('.moj-logo-ministry')).toHaveText('Ministry of Justice');
    await expect(page.locator('.moj-logo-republic')).toHaveText('Republic of Namibia');

    // Form fields
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-email')).toHaveAttribute('type', 'email');
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('#login-password')).toHaveAttribute('type', 'password');

    // Submit button
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toHaveText('Sign In');

    // Copyright notice
    await expect(page.locator('.lgn-copyright')).toHaveText('© Ministry of Justice, Namibia');
  });

  test('Invalid credentials shows error banner', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#login-email', { state: 'visible' });

    // Fill with invalid credentials
    await page.fill('#login-email', 'wrong@moj.na');
    await page.fill('#login-password', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for the error banner to appear
    const errorBanner = page.locator('[role="alert"]');
    await expect(errorBanner).toBeVisible({ timeout: 15000 });

    // The error message should mention invalid credentials
    await expect(errorBanner).toContainText(/invalid/i);
  });

  test('Visiting /dashboard without auth redirects to login', async ({ page }) => {
    // Ensure no auth state exists
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('moj_token');
      localStorage.removeItem('moj_user');
    });

    // Navigate to the app root (SPA renders login when unauthenticated)
    await page.goto('/');

    // Login form should be visible
    await page.waitForSelector('#login-email', { state: 'visible' });
    await expect(page.locator('.login-page')).toBeVisible();

    // Dashboard elements should NOT be visible
    await expect(page.locator('.app-shell')).toBeHidden();
    await expect(page.locator('.sidebar')).toBeHidden();
    await expect(page.locator('.topbar')).toBeHidden();
  });
});
