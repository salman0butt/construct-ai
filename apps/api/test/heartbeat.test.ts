import assert from 'node:assert/strict';
import { test } from 'node:test';
import { workerLeaseIsFresh } from '../src/heartbeat.ts';

test('requires a registered worker and an expiring positive lease', () => {
  assert.equal(workerLeaseIsFresh(1, 15000), true);
  assert.equal(workerLeaseIsFresh(2, 1), true);
  for (const ttl of [-2, -1, 0, 15001, NaN, 1.5]) assert.equal(workerLeaseIsFresh(1, ttl), false);
  for (const count of [0, -1, NaN, 0.5]) assert.equal(workerLeaseIsFresh(count, 5000), false);
});
