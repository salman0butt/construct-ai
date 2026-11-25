import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseRedisConnection, processFoundationJob } from '../src/foundation.ts';

const nonce = '123e4567-e89b-42d3-a456-426614174000';

test('defaults to loopback Redis', () => {
  assert.deepEqual(parseRedisConnection(undefined), { host: '127.0.0.1', port: 6379, db: 0 });
});

test('accepts an explicit local port', () => {
  assert.deepEqual(parseRedisConnection('redis://localhost:6380/0'), { host: '127.0.0.1', port: 6380, db: 0 });
});

test('rejects nonlocal or malformed Redis URLs without echoing them', () => {
  for (const value of ['', 'redis://example.com:6379', 'rediss://localhost:6379', 'redis://user:secret@localhost:6379', 'redis://localhost:0', 'redis://localhost:65536', 'redis://localhost/1', 'redis://localhost?x=1', 'redis://localhost#test', ' redis://localhost']) {
    assert.throws(() => parseRedisConnection(value), { message: 'REDIS_URL must be a loopback redis:// URL with database 0 and no credentials' });
  }
});

test('round-trip probe echoes the validated nonce', () => {
  assert.deepEqual(processFoundationJob('foundation.ping', { nonce }), { nonce, worker: 'construct-ai-worker' });
});

test('rejects unsupported jobs and malformed probe payloads', () => {
  assert.throws(() => processFoundationJob('invoice.post', { nonce }), /Unsupported foundation job/);
  for (const value of [null, [], {}, { nonce: 'bad' }, { nonce, tenant: 'other' }]) {
    assert.throws(() => processFoundationJob('foundation.ping', value), /Invalid foundation probe payload/);
  }
});
