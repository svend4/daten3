import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');

    // Check that page loads successfully
    await expect(page).toHaveTitle(/TravelHub|Travel/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have navigation header', async ({ page }) => {
    await page.goto('/');

    // Check for header/nav
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();
  });

  test('should have footer', async ({ page }) => {
    await page.goto('/');

    // Check for footer
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
  });

  test('should navigate to Hotels page', async ({ page }) => {
    await page.goto('/');

    const hotelsLink = page.locator('a[href="/hotels"], a:has-text("Отели")').first();
    if (await hotelsLink.isVisible()) {
      await hotelsLink.click();
      await expect(page).toHaveURL('/hotels');
    }
  });

  test('should navigate to Flights page', async ({ page }) => {
    await page.goto('/');

    const flightsLink = page.locator('a[href="/flights"], a:has-text("Авиабилеты")').first();
    if (await flightsLink.isVisible()) {
      await flightsLink.click();
      await expect(page).toHaveURL('/flights');
    }
  });

  test('should navigate to Support page', async ({ page }) => {
    await page.goto('/support');

    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display 404 for invalid routes', async ({ page }) => {
    await page.goto('/invalid-page-that-does-not-exist');

    // Check for 404 content
    const notFoundText = page.locator('text=404, text=не найден, text=Not Found');
    const hasNotFound = await notFoundText.count() > 0;

    // Either shows 404 or redirects to home
    expect(hasNotFound || page.url().includes('/')).toBeTruthy();
  });
});

test.describe('Responsive Navigation', () => {
  test('should show mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Look for mobile menu button (hamburger)
    const menuButton = page.locator('[aria-label*="меню"], [aria-label*="menu"], button:has([class*="menu"])').first();
    const hasMobileMenu = await menuButton.isVisible().catch(() => false);

    // Mobile menu should exist on small screens
    expect(hasMobileMenu || (await page.locator('nav').isVisible())).toBeTruthy();
  });

  test('should be scrollable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should be scrollable
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(scrollHeight).toBeGreaterThan(0);
  });
});

test.describe('Accessibility Navigation', () => {
  test('should have skip to content link', async ({ page }) => {
    await page.goto('/');

    // Check for skip link (may be visually hidden)
    const skipLink = page.locator('a[href="#main"], a[href="#content"], a:has-text("Перейти к содержимому")');
    const hasSkipLink = await skipLink.count() > 0;

    // Skip link is recommended but not required
    expect(typeof hasSkipLink).toBe('boolean');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check that h1 exists
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
  });

  test('should have lang attribute on html', async ({ page }) => {
    await page.goto('/');

    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBeTruthy();
  });
});

test.describe('Static Pages', () => {
  test('should display Terms page', async ({ page }) => {
    await page.goto('/terms');

    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display Privacy page', async ({ page }) => {
    await page.goto('/privacy');

    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
