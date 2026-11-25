import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createReadinessCheck } from '../src/readiness.ts';

const names = ['database', 'redis', 'storage', 'worker'] as const;
const healthy = () => ({ database: async () => true, redis: async () => true, storage: async () => true, worker: async () => true });

test('all required dependencies must be healthy', async () => {
  const result = await createReadinessCheck(healthy())();
  assert.deepEqual(result, { service: 'construct-ai-api', check: 'readiness', status: 'ready', checks: { database: 'up', redis: 'up', storage: 'up', worker: 'up' } });
});

test('any unavailable dependency prevents readiness', async () => {
  for (const name of names) {
    const result = await createReadinessCheck({ ...healthy(), [name]: async () => false })();
    assert.equal(result.status, 'not_ready');
    assert.equal(result.checks[name], 'down');
    assert.equal(Object.values(result.checks).filter(x => x === 'up').length, 3);
  }
});

test('missing and nonboolean checks fail closed', async () => {
  const result = await createReadinessCheck({ database: async () => true, redis: async () => 'yes' })();
  assert.equal(result.status, 'not_ready');
  assert.deepEqual(result.checks, { database: 'up', redis: 'down', storage: 'down', worker: 'down' });
});

test('errors are isolated and never returned to the caller', async () => {
  const result = await createReadinessCheck({ ...healthy(), database: async () => { throw new Error('private-password'); } })();
  assert.equal(result.status, 'not_ready');
  assert.equal(result.checks.database, 'down');
  assert.ok(!JSON.stringify(result).includes('private-password'));
  assert.equal(result.checks.redis, 'up');
});

test('a stuck probe times out and receives an abort signal', async () => {
  let aborted = false;
  const result = await createReadinessCheck({ ...healthy(), worker: signal => new Promise(() => { signal.addEventListener('abort', () => { aborted = true; }); }) }, 25)();
  assert.equal(result.status, 'not_ready');
  assert.equal(result.checks.worker, 'timeout');
  assert.equal(aborted, true);
});

test('concurrent requests share a single in-flight probe batch', async () => {
  let calls = 0;
  let release: (value: boolean) => void = () => {};
  const check = createReadinessCheck({ ...healthy(), database: () => { calls++; return new Promise(resolve => { release = resolve; }); } });
  const a = check(); const b = check();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  release(true);
  assert.deepEqual(await a, await b);
});

test('a completed batch does not mask a later outage', async () => {
  let up = true;
  const check = createReadinessCheck({ ...healthy(), redis: async () => up });
  assert.equal((await check()).status, 'ready');
  up = false;
  assert.equal((await check()).status, 'not_ready');
});
