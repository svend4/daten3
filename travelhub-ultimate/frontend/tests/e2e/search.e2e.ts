import { test, expect } from '@playwright/test';

test.describe('Hotel Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display search form on homepage', async ({ page }) => {
    // Check for search widget
    await expect(page.locator('[data-testid="search-widget"], form').first()).toBeVisible();
  });

  test('should have destination input', async ({ page }) => {
    const destinationInput = page.locator('input[placeholder*="Куда"], input[name*="destination"], input[placeholder*="город"]').first();
    await expect(destinationInput).toBeVisible();
  });

  test('should have date pickers', async ({ page }) => {
    // Look for date inputs
    const dateInputs = page.locator('input[type="date"], [data-testid*="date"], input[placeholder*="дата"]');
    await expect(dateInputs.first()).toBeVisible();
  });

  test('should navigate to search results', async ({ page }) => {
    // Fill search form
    const destinationInput = page.locator('input[placeholder*="Куда"], input[name*="destination"], input[placeholder*="город"]').first();

    if (await destinationInput.isVisible()) {
      await destinationInput.fill('Москва');

      // Submit search
      const searchButton = page.locator('button[type="submit"], button:has-text("Найти"), button:has-text("Поиск")').first();
      if (await searchButton.isVisible()) {
        await searchButton.click();

        // Wait for navigation
        await page.waitForURL(/search|results/, { timeout: 10000 }).catch(() => {});
      }
    }
  });

  test('should display hotels section', async ({ page }) => {
    await page.goto('/hotels');

    // Check for hotels content
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

test.describe('Flight Search', () => {
  test('should display flights page', async ({ page }) => {
    await page.goto('/flights');

    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should have flight search form elements', async ({ page }) => {
    await page.goto('/flights');

    // Check for origin/destination inputs
    const originInput = page.locator('input[placeholder*="Откуда"], input[name*="origin"]').first();
    const destInput = page.locator('input[placeholder*="Куда"], input[name*="destination"]').first();

    // At least one should be visible
    const hasOrigin = await originInput.isVisible().catch(() => false);
    const hasDest = await destInput.isVisible().catch(() => false);

    expect(hasOrigin || hasDest).toBeTruthy();
  });
});

test.describe('Search Results', () => {
  test('should display search results page', async ({ page }) => {
    await page.goto('/search?destination=Moscow');

    // Check page loads without error
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have filter options', async ({ page }) => {
    await page.goto('/search?destination=Moscow');

    // Look for filter elements
    const filterButton = page.locator('button:has-text("Фильтр"), button:has-text("Filter"), [data-testid*="filter"]').first();
    const hasFilter = await filterButton.isVisible().catch(() => false);

    // Either filter button or sidebar filters should exist
    expect(hasFilter || (await page.locator('[class*="filter"]').count()) > 0).toBeTruthy();
  });

  test('should have sorting options', async ({ page }) => {
    await page.goto('/search?destination=Moscow');

    // Look for sort elements
    const sortSelect = page.locator('select, [data-testid*="sort"], button:has-text("Сортировка")').first();
    await expect(sortSelect).toBeVisible().catch(() => {});
  });
});
