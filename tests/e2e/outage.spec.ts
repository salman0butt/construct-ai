import { expect, test } from '@playwright/test';

test('real browser shows an unavailable status when the API is stopped', async ({ page, request }) => {
  // Stop only the local API before this scenario; leave the frontend running.
  await expect(request.get('http://127.0.0.1:4000/api/v1/health', { timeout: 3000, maxRedirects: 0 })).rejects.toThrow();
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Service status' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Unavailable');
});
