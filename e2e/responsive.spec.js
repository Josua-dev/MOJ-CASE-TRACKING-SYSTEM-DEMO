/**
 * Responsive layout E2E tests for MOJ Case Tracker.
 *
 * Verifies the UI adapts correctly at mobile (375px), tablet (768px),
 * and desktop (1440px) viewports.
 */
const { test, expect } = require('@playwright/test');
const { login, waitForPage } = require('./fixtures');

test.describe('Responsive layout', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Mobile 375px — hamburger visible, sidebar hidden by default', async ({ page }) => {
    // Set narrow mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    // Wait for the layout to reflow
    await page.waitForTimeout(300);

    // Hamburger button should be visible on mobile
    const hamburger = page.locator('.hamburger-btn');
    await expect(hamburger).toBeVisible();

    // Sidebar should be hidden off-screen (not visible)
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).not.toBeVisible();

    // Clicking hamburger opens sidebar overlay
    await hamburger.click();
    await expect(sidebar).toBeVisible();

    // Sidebar should have the mobile-open class
    await expect(sidebar).toHaveClass(/sidebar-mobile-open/);

    // Overlay should be visible
    await expect(page.locator('.sidebar-overlay')).toBeVisible();
  });

  test('Tablet 768px — layout adapts', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);

    // Hamburger should be visible on tablet
    const hamburger = page.locator('.hamburger-btn');
    await expect(hamburger).toBeVisible();

    // Subtitle and date are hidden on tablet for space
    await expect(page.locator('.topbar-subtitle')).toBeHidden();
    await expect(page.locator('.topbar-date')).toBeHidden();

    // Sidebar starts off-screen
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).not.toBeVisible();

    // Open sidebar and verify it appears
    await hamburger.click();
    await expect(sidebar).toBeVisible();
  });

  test('Desktop 1440px — full layout', async ({ page }) => {
    // Set large desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);

    // Hamburger should be hidden on desktop
    const hamburger = page.locator('.hamburger-btn');
    await expect(hamburger).toBeHidden();

    // Sidebar should be visible as a permanent fixture
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();

    // Full topbar content should be visible
    await expect(page.locator('.topbar h2')).toBeVisible();
    await expect(page.locator('.topbar-subtitle')).toBeVisible();
    await expect(page.locator('.topbar-date')).toBeVisible();

    // Dashboard heading should be present
    await expect(page.locator('.topbar h2')).toHaveText('Dashboard');
  });
});
