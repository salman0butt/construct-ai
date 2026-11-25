import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Queue, QueueEvents } from 'bullmq';
import { FOUNDATION_QUEUE, parseRedisConnection } from './foundation.ts';

async function main() {
  const local = parseRedisConnection(process.env.REDIS_URL);
  const queue = new Queue(FOUNDATION_QUEUE, {
    connection: { ...local, maxRetriesPerRequest: 1 },
  });
  const events = new QueueEvents(FOUNDATION_QUEUE, {
    connection: { ...local, maxRetriesPerRequest: null },
  });
  queue.on('error', () => console.error('Probe queue connection error'));
  events.on('error', () => console.error('Probe events connection error'));
  const nonce = randomUUID();
  const deadline = setTimeout(() => {
    console.error('Worker round-trip deadline exceeded; verify local Redis and worker');
    process.exit(1);
  }, 20000);
  try {
    await events.waitUntilReady();
    const job = await queue.add('foundation.ping', { nonce }, {
      jobId: nonce,
      attempts: 1,
      removeOnComplete: { age: 60, count: 100 },
      removeOnFail: { age: 60, count: 100 },
    });
    const result: unknown = await job.waitUntilFinished(events, 10000);
    assert.deepEqual(result, { nonce, worker: 'construct-ai-worker' });
    console.log('Worker round-trip verified');
  } finally {
    try {
      await Promise.all([queue.close(), events.close()]);
    } finally {
      clearTimeout(deadline);
    }
  }
}

void main().catch(() => {
  console.error('Worker round-trip failed; no readiness claim');
  process.exitCode = 1;
});
