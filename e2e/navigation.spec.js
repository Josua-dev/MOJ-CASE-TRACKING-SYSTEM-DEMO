/**
 * Navigation E2E tests for MOJ Case Tracker.
 *
 * Tests sidebar navigation links and keyboard shortcuts (1-6) for
 * switching between pages.
 */
const { test, expect } = require('@playwright/test');
const { login, waitForPage, PAGE_TITLES } = require('./fixtures');

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Sidebar navigation links work', async ({ page }) => {
    const navLinks = [
      { label: 'Dashboard', page: 'dashboard' },
      { label: 'Cases', page: 'cases' },
    ];

    for (const { label, page: pageName } of navLinks) {
      // Click the nav button by its visible label text
      const link = page.locator('#main-navigation .nav-link', { hasText: label });
      await link.click();

      // Wait for the page heading to update
      const expectedTitle = PAGE_TITLES[pageName];
      await expect(page.locator('.topbar h2')).toHaveText(expectedTitle);

      // The active link should have aria-current="page"
      await expect(link).toHaveAttribute('aria-current', 'page');
    }

    // Verify other nav links exist (admin-privileged pages may or may not be visible)
    const navButtons = page.locator('#main-navigation .nav-link span').allTextContents();
    const labels = await navButtons;
    expect(labels).toEqual(
      expect.arrayContaining(['Dashboard', 'Cases', 'Shortcuts', 'Sign Out']),
    );
  });

  test('Keyboard shortcuts (1-6) switch pages', async ({ page }) => {
    // Define the key-to-page mapping (matching App.js handleKeyDown)
    const shortcuts = [
      { key: '1', page: 'dashboard' },
      { key: '2', page: 'cases' },
      { key: '3', page: 'visualisations' },
      { key: '4', page: 'users' },
      { key: '5', page: 'calendar' },
      { key: '6', page: 'reports' },
    ];

    for (const { key, page: pageName } of shortcuts) {
      // Press the number key to trigger the keyboard shortcut
      await page.keyboard.press(key);

      // Wait for the heading to update to the expected page title
      const expectedTitle = PAGE_TITLES[pageName];
      await expect(page.locator('.topbar h2')).toHaveText(expectedTitle, {
        timeout: 5000,
      });
    }
  });
});
