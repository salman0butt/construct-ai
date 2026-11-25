import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { checkHttp } from '../scripts/http-smoke.mjs';

const health = { service: 'construct-ai-api', status: 'ok', check: 'liveness' };
const page = '<html><body><h2>Service status</h2><span role="status">Responding</span></body></html>';

async function serve(t, handler) {
  const server = createServer(handler);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return String(server.address().port);
}

async function fixture(t, apiHandler, webHandler) {
  const apiPort = await serve(t, apiHandler ?? ((req, res) => {
    assert.equal(req.url, '/api/v1/health');
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(health));
  }));
  const webPort = await serve(t, webHandler ?? ((req, res) => {
    assert.equal(req.url, '/');
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(page);
  }));
  return { apiPort, webPort, timeoutMs: 1000 };
}

test('validates real loopback HTTP responses from both services', async t => {
  assert.deepEqual(await checkHttp(await fixture(t)), { api: true, web: true });
});

test('rejects an API reporting a different service', async t => {
  const opts = await fixture(t, (_req, res) => res.end(JSON.stringify({ ...health, service: 'other' })));
  assert.deepEqual(await checkHttp(opts), { api: false, web: true });
});

test('rejects web HTML that reports API unavailable', async t => {
  const opts = await fixture(t, undefined, (_req, res) => res.end(page.replace('Responding', 'Unavailable')));
  assert.deepEqual(await checkHttp(opts), { api: true, web: false });
});

test('rejects HTTP errors and malformed JSON', async t => {
  const opts = await fixture(t, (_req, res) => res.end('not-json'), (_req, res) => { res.statusCode = 503; res.end(page); });
  assert.deepEqual(await checkHttp(opts), { api: false, web: false });
});

test('rejects redirects without following them', async t => {
  let redirected = 0;
  const target = await serve(t, (_req, res) => { redirected++; res.end(JSON.stringify(health)); });
  const opts = await fixture(t, (_req, res) => { res.writeHead(302, { location: `http://127.0.0.1:${target}/` }); res.end(); });
  assert.deepEqual(await checkHttp(opts), { api: false, web: true });
  assert.equal(redirected, 0);
});

test('bounds an unresponsive API request', async t => {
  const opts = await fixture(t, (_req, _res) => {});
  assert.deepEqual(await checkHttp({ ...opts, timeoutMs: 100 }), { api: false, web: true });
});

test('invalid ports are rejected before network calls', async () => {
  await assert.rejects(checkHttp({ apiPort: '4000/path', webPort: '3000' }), /port/i);
  await assert.rejects(checkHttp({ apiPort: '4000', webPort: '65536' }), /port/i);
});
