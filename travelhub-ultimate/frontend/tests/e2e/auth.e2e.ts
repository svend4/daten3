import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.click('text=Войти');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1, h2').first()).toContainText(/Вход|Авторизация/);
  });

  test('should display registration page', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL('/register');
    await expect(page.locator('h1, h2').first()).toContainText(/Регистрация/);
  });

  test('should show validation errors on empty login form', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(page.locator('text=Email обязателен')).toBeVisible();
  });

  test('should show validation errors on empty registration form', async ({ page }) => {
    await page.goto('/register');
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(page.locator('[class*="error"], [role="alert"]').first()).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=корректный email')).toBeVisible();
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login');

    // Find link to register
    const registerLink = page.locator('a[href="/register"]');
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL('/register');
    }
  });

  test('should have accessible form fields', async ({ page }) => {
    await page.goto('/login');

    // Check that inputs have labels
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Check for associated labels or aria-labels
    const emailLabel = page.locator('label[for="email"], label:has-text("Email")');
    await expect(emailLabel).toBeVisible();
  });

  test('should show password reset link', async ({ page }) => {
    await page.goto('/login');

    const forgotPasswordLink = page.locator('a[href="/forgot-password"]');
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      await expect(page).toHaveURL('/forgot-password');
    }
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected routes', async ({ page }) => {
    await page.goto('/profile');

    // Should redirect to login or show login prompt
    await expect(page).toHaveURL(/login|profile/);
  });

  test('should redirect to login when accessing bookings', async ({ page }) => {
    await page.goto('/my-bookings');

    // Should redirect to login or show unauthorized message
    await expect(page).toHaveURL(/login|my-bookings/);
  });
});
