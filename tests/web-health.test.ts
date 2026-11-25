import assert from 'node:assert/strict';
import { createServer, type RequestListener } from 'node:http';
import { test, type TestContext } from 'node:test';
import { apiIsLive } from '../apps/web/app/api-health.ts';

const health = { service: 'construct-ai-api', status: 'ok', check: 'liveness' };
async function serve(t: TestContext, handler: RequestListener) {
  const server = createServer(handler);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise<void>(resolve => { server.close(() => resolve()); server.closeAllConnections(); }));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing fixture address');
  return String(address.port);
}
async function check(port: string) {
  const previous = process.env.API_PORT;
  process.env.API_PORT = port;
  try { return await apiIsLive(); }
  finally {
    if (previous === undefined) delete process.env.API_PORT;
    else process.env.API_PORT = previous;
  }
}

test('accepts the real loopback liveness contract', async t => {
  const port = await serve(t, (req, res) => {
    assert.equal(req.url, '/api/v1/health');
    res.end(JSON.stringify(health));
  });
  assert.equal(await check(port), true);
});

test('rejects a redirect without requesting the destination', async t => {
  let hits = 0;
  const target = await serve(t, (_req, res) => { hits++; res.end(JSON.stringify(health)); });
  const port = await serve(t, (_req, res) => {
    res.writeHead(302, { location: 'http://127.0.0.1:' + target + '/redirect-target' });
    res.end();
  });
  assert.deepEqual([await check(port), hits], [false, 0]);
});

test('rejects an unexpected service identity', async t => {
  const port = await serve(t, (_req, res) => res.end(JSON.stringify({ ...health, service: 'other' })));
  assert.equal(await check(port), false);
});

test('rejects HTTP errors, malformed JSON and invalid ports', async t => {
  const error = await serve(t, (_req, res) => { res.statusCode = 503; res.end(JSON.stringify(health)); });
  const malformed = await serve(t, (_req, res) => res.end('not-json'));
  for (const port of [error, malformed, '4000/path', '65536']) assert.equal(await check(port), false);
});
