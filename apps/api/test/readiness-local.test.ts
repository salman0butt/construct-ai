import assert from 'node:assert/strict';
import { createServer, type RequestListener } from 'node:http';
import { test, type TestContext } from 'node:test';
import { databaseOptions, redisOptions, probeStorage } from '../src/readiness-local.ts';

const secret = 'sb_secret_synthetic';
async function server(t: TestContext, handler: RequestListener) {
  const service = createServer(handler);
  await new Promise<void>(resolve => service.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise<void>(resolve => { service.close(() => resolve()); service.closeAllConnections(); }));
  const address = service.address();
  if (!address || typeof address === 'string') throw new Error('Missing fixture address');
  return `http://localhost:${address.port}`;
}

test('database options force loopback and strip schema option', () => {
  assert.deepEqual(databaseOptions('postgresql://app:secret%3Apass@localhost:54322/postgres?schema=construct_ai'), { host: '127.0.0.1', port: 54322, database: 'postgres', user: 'app', password: 'secret:pass' });
});

test('database rejects remote and connection overrides without exposing credentials', () => {
  for (const value of [undefined, 'postgresql://app:secret@evil.test:5432/db', 'postgresql://app:secret@localhost:54322/db?host=evil.test', 'postgresql://app:secret@localhost:0/db', 'postgresql://app@localhost:54322/db']) {
    assert.throws(() => databaseOptions(value), error => error instanceof Error && !error.message.includes('secret'));
  }
});

test('Redis targets loopback only', () => {
  assert.deepEqual(redisOptions(undefined), { host: '127.0.0.1', port: 6379, db: 0 });
  assert.deepEqual(redisOptions('redis://localhost:6380/0'), { host: '127.0.0.1', port: 6380, db: 0 });
  for (const value of ['redis://evil.test', 'redis://localhost:0', 'redis://user:pw@localhost', 'redis://localhost/1']) assert.throws(() => redisOptions(value));
});

test('storage verifies the dedicated private bucket through a local request', async t => {
  const url = await server(t, (req, res) => {
    assert.equal(req.url, '/storage/v1/bucket/construct-ai-foundation');
    assert.equal(req.headers.apikey, secret);
    assert.equal(req.headers.authorization, undefined);
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ id: 'construct-ai-foundation', public: false }));
  });
  assert.equal(await probeStorage(url, secret, AbortSignal.timeout(1000)), true);
});

test('storage rejects public or wrong buckets', async t => {
  const url = await server(t, (_req, res) => res.end(JSON.stringify({ id: 'construct-ai-foundation', public: true })));
  assert.equal(await probeStorage(url, secret, AbortSignal.timeout(1000)), false);
});

test('storage refuses public keys, hosted endpoints, and redirects', async t => {
  let hits = 0;
  const target = await server(t, (_req, res) => { hits++; res.end('{}'); });
  const redirect = await server(t, (_req, res) => { res.writeHead(302, { location: target }); res.end(); });
  assert.equal(await probeStorage(target, 'sb_publishable_synthetic', AbortSignal.timeout(1000)), false);
  assert.equal(await probeStorage('https://example.supabase.co', secret, AbortSignal.timeout(1000)), false);
  assert.equal(await probeStorage(redirect, secret, AbortSignal.timeout(1000)), false);
  assert.equal(hits, 0);
});
