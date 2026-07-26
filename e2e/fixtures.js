/**
 * Shared test fixtures and helpers for MOJ Case Tracker E2E tests.
 */

/** Test user credentials */
const TEST_USER = {
  email: 'test@moj.na',
  password: 'password123',
};

/**
 * Page title map for the SPA's state-based routing.
 * When the active page changes, the heading text updates to these values.
 */
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  cases: 'Case Register',
  visualisations: 'Visualisations',
  users: 'User Management',
  calendar: 'Court Calendar',
  reports: 'Reports',
};

/**
 * Log in as the test user.
 * Fills in the email and password fields, then clicks Sign In.
 * Waits for the dashboard heading to confirm successful login.
 *
 * @param {import('@playwright/test').Page} page
 */
async function login(page) {
  await page.goto('/');
  await page.waitForSelector('#login-email', { state: 'visible' });

  await page.fill('#login-email', TEST_USER.email);
  await page.fill('#login-password', TEST_USER.password);
  await page.click('button[type="submit"]');

  // Wait for navigation to complete — dashboard heading should appear
  await page.waitForFunction(
    (expected) => {
      const h2 = document.querySelector('.topbar h2');
      return h2 && h2.textContent.trim() === expected;
    },
    PAGE_TITLES.dashboard,
    { timeout: 15000 },
  );
}

/**
 * Wait for a specific page to be active by checking the topbar heading.
 * The app uses state-based routing, so we wait for the matching heading.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} pageName - One of: dashboard, cases, visualisations, users, calendar, reports
 */
async function waitForPage(page, pageName) {
  const expected = PAGE_TITLES[pageName];
  if (!expected) {
    throw new Error(`Unknown page name "${pageName}". Valid: ${Object.keys(PAGE_TITLES).join(', ')}`);
  }

  await page.waitForFunction(
    (heading) => {
      const h2 = document.querySelector('.topbar h2');
      return h2 && h2.textContent.trim() === heading;
    },
    expected,
    { timeout: 10000 },
  );
}

module.exports = {
  TEST_USER,
  PAGE_TITLES,
  login,
  waitForPage,
};
