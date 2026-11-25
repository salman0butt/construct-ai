import { expect, test } from '@playwright/test';

const api = 'http://127.0.0.1:4000';
const degraded = process.env.E2E_SCENARIO === 'degraded';

test('browser displays real server-side API liveness on desktop and mobile', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Service status' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('Responding');
  }
});

test('API liveness and readiness match the selected infrastructure scenario', async ({ request }) => {
  const live = await request.get(api + '/api/v1/health', { maxRedirects: 0 });
  expect(live.status()).toBe(200);
  expect(await live.json()).toEqual({ service: 'construct-ai-api', check: 'liveness', status: 'ok' });
  const response = await request.get(api + '/api/v1/health/ready', { maxRedirects: 0 });
  expect(response.status()).toBe(degraded ? 503 : 200);
  expect(response.headers()['cache-control']).toContain('no-store');
  const body = await response.json();
  expect(body.service).toBe('construct-ai-api');
  expect(body.check).toBe('readiness');
  expect(body.status).toBe(degraded ? 'not_ready' : 'ready');
  expect(Object.keys(body.checks).sort()).toEqual(['database', 'redis', 'storage', 'worker']);
  const states: unknown[] = Object.values(body.checks);
  for (const state of states) expect(['up', 'down', 'timeout']).toContain(state);
  expect(states.every(state => state === 'up')).toBe(!degraded);
});

test('Swagger UI and generated OpenAPI document describe both health routes', async ({ page, request }) => {
  const response = await page.goto(api + '/docs');
  expect(response?.status()).toBe(200);
  await expect(page.locator('.swagger-ui .info .title')).toContainText('ConstructAI API');
  const raw = await request.get(api + '/docs-json', { maxRedirects: 0 });
  expect(raw.status()).toBe(200);
  const doc = await raw.json();
  expect(doc.openapi).toMatch(/^3\./);
  expect(doc.info.title).toBe('ConstructAI API');
  expect(doc.paths['/api/v1/health'].get.responses['200']).toBeDefined();
  expect(doc.paths['/api/v1/health/ready'].get.responses['200']).toBeDefined();
  const unavailable = doc.paths['/api/v1/health/ready'].get.responses['503'];
  expect(unavailable.content['application/json'].schema.properties.status.enum).toEqual(['not_ready']);
});
