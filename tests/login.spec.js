import { test, expect } from '@playwright/test';

// TC1: Login success
test('TC1 - Login with valid credentials', async ({ page }) => {
  await page.goto('/');
  
  await page.getByTestId('username').fill('standard_user');
  await page.getByTestId('password').fill('secret_sauce');
  await page.getByTestId('login-button').click();

  // Should navigate to dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByTestId('welcome-text')).toContainText('Welcome');
});

// TC2: Login with wrong password
test('TC2 - Login with wrong password shows error', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('username').fill('standard_user');
  await page.getByTestId('password').fill('wrong_password');
  await page.getByTestId('login-button').click();

  // Should show error message
  await expect(page.getByTestId('error-message')).toBeVisible();
  await expect(page.getByTestId('error-message')).toContainText('Invalid');
});

// TC3: Login with empty inputs
test('TC3 - Login with empty inputs shows error', async ({ page }) => {
  await page.goto('/');

  // Click login without filling anything
  await page.getByTestId('login-button').click();

  // Should show error for empty fields
  await expect(page.getByTestId('error-message')).toBeVisible();
  await expect(page.getByTestId('error-message')).toContainText('required');
});

// TC4: Login with special characters - INTENTIONAL FAIL for demo
test('TC4 - Login with special characters handles safely', async ({ page }) => {
  await page.goto('/');

  // Input XSS-like special characters
  await page.getByTestId('username').fill('<script>alert("xss")</script>');
  await page.getByTestId('password').fill('test123');
  await page.getByTestId('login-button').click();

  // EXPECTED: Should show a sanitization error or safe error message
  // BUG: The app does NOT sanitize special chars, so this test will FAIL
  // because the error message won't mention "invalid characters"
  await expect(page.getByTestId('error-message')).toContainText('invalid characters');
});
