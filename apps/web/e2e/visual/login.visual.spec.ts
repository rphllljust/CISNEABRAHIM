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

  test('reference desktop composition', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Reference raster is desktop-only.');
    await page.setViewportSize({ width: 1016, height: 510 });
    await page.goto('/login');
    await stabilizePage(page);
    await expect(page.locator('main')).toHaveScreenshot('login-reference.png', {
      animations: 'disabled',
    });
  });
});
