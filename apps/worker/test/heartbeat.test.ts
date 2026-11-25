import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHeartbeat } from '../src/heartbeat.ts';

test('publishes a bounded Redis lease for a running worker', async () => {
  const writes: unknown[][] = [];
  const heartbeat = createHeartbeat(async (...args) => { writes.push(args); }, () => true);
  await heartbeat.pulse();
  assert.deepEqual(writes, [['construct-ai:foundation:worker-heartbeat:v1', 'alive', 15000]]);
});

test('does not renew while worker is paused or stopped', async () => {
  let running = false;
  let writes = 0;
  const heartbeat = createHeartbeat(async () => { writes++; }, () => running);
  await heartbeat.pulse();
  running = true;
  await heartbeat.pulse();
  heartbeat.stop();
  await heartbeat.pulse();
  assert.equal(writes, 1);
});

test('concurrent pulses share a single pending write', async () => {
  let calls = 0;
  let release: () => void = () => {};
  const heartbeat = createHeartbeat(() => { calls++; return new Promise<void>(resolve => { release = resolve; }); }, () => true);
  const a = heartbeat.pulse(); const b = heartbeat.pulse();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  release(); await Promise.all([a, b]);
});

test('a failed Redis renewal does not suppress later recovery', async () => {
  let calls = 0;
  const heartbeat = createHeartbeat(async () => { if (++calls === 1) throw new Error('offline'); }, () => true);
  await assert.rejects(heartbeat.pulse());
  await heartbeat.pulse();
  assert.equal(calls, 2);
});
