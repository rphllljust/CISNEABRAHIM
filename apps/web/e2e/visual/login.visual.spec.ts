import { test, expect } from '@playwright/test';
import { stabilizePage } from '../fixtures/visual-helpers';

test.describe('login page visual regression', () => {
  test('login form layout', async ({ page }) => {
    await page.goto('/login');
    await stabilizePage(page);
    await expect(page.locator('main')).toHaveScreenshot('login-form.png', {
      animations: 'disabled',
    });
  });
});
