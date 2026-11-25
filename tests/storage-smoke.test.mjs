import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { storageSmoke } from '../scripts/storage-smoke.mjs';

const bucket = 'construct-ai-foundation';
const key = 'sb_secret_synthetic';
async function fixture(t, { publicBucket = false, corrupt = false, failDelete = false } = {}) {
  const requests = [];
  const objects = new Map();
  const server = createServer(async (req, res) => {
    const method = req.method;
    const path = req.url;
    requests.push({ method, path });
    assert.equal(req.headers.apikey, key);
    if (path === '/storage/v1/bucket/' + bucket) {
      res.end(JSON.stringify({ id: bucket, public: publicBucket })); return;
    }
    const match = /^\/storage\/v1\/object\/(authenticated\/)?construct-ai-foundation\/(smoke-[a-f0-9-]+\.txt)$/.exec(path);
    if (!match) { res.statusCode = 404; res.end(); return; }
    const name = match[2];
    if (method === 'POST') {
      assert.equal(req.headers['x-upsert'], undefined);
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      objects.set(name, Buffer.concat(chunks)); res.end('{}');
    } else if (method === 'GET' && match[1]) {
      if (!objects.has(name)) { res.statusCode = 404; res.end(); }
      else res.end(corrupt ? 'wrong bytes' : objects.get(name));
    } else if (method === 'DELETE' && !match[1]) {
      if (failDelete) { res.statusCode = 500; res.end(); }
      else { objects.delete(name); res.end('{}'); }
    } else { res.statusCode = 405; res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return { url: 'http://localhost:' + server.address().port, requests, objects };
}

test('round trip writes exact synthetic bytes and deletes only its own object', async t => {
  const f = await fixture(t);
  const result = await storageSmoke({ url: f.url, key });
  assert.equal(result.ok, true);
  assert.equal(f.objects.size, 0);
  assert.deepEqual(f.requests.map(x => x.method), ['GET','POST','GET','DELETE','GET']);
  assert.equal(f.requests[1].path, f.requests[3].path);
});

test('public bucket never receives a write', async t => {
  const f = await fixture(t, { publicBucket: true });
  const result = await storageSmoke({ url: f.url, key });
  assert.equal(result.ok, false);
  assert.deepEqual(f.requests.map(x => x.method), ['GET']);
});

test('corrupt bytes fail the smoke but still clean up the uploaded object', async t => {
  const f = await fixture(t, { corrupt: true });
  const result = await storageSmoke({ url: f.url, key });
  assert.equal(result.ok, false);
  assert.equal(f.objects.size, 0);
  assert.ok(f.requests.some(x => x.method === 'DELETE'));
});

test('cleanup failure is reported and gives only the synthetic object name', async t => {
  const f = await fixture(t, { failDelete: true });
  const result = await storageSmoke({ url: f.url, key });
  assert.equal(result.ok, false);
  assert.ok(f.objects.has(result.cleanupObject));
  assert.ok(!JSON.stringify(result).includes(key));
});

test('rejects external endpoints and publishable keys before any requests', async t => {
  const f = await fixture(t);
  assert.equal((await storageSmoke({ url: 'https://example.supabase.co', key })).ok, false);
  assert.equal((await storageSmoke({ url: f.url, key: 'sb_publishable_synthetic' })).ok, false);
  assert.equal(f.requests.length, 0);
});
