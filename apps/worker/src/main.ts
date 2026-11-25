import { Worker, UnrecoverableError } from 'bullmq';
import { FOUNDATION_QUEUE, parseRedisConnection, processFoundationJob } from './foundation.ts';

async function main() {
  const connection = { ...parseRedisConnection(process.env.REDIS_URL), maxRetriesPerRequest: null };
  const worker = new Worker(FOUNDATION_QUEUE, async job => {
    try {
      return processFoundationJob(job.name, job.data);
    } catch (error) {
      throw new UnrecoverableError(error instanceof Error ? error.message : 'Invalid job');
    }
  }, { connection, concurrency: 1 });
  worker.on('error', () => console.error('Worker connection or processing error'));
  worker.on('failed', () => console.error('Foundation probe failed'));

  let closing = false;
  const shutdown = async () => {
    if (closing) return;
    closing = true;
    const deadline = setTimeout(() => {
      console.error('Worker shutdown timed out');
      process.exit(1);
    }, 10000);
    try {
      await worker.close();
    } catch {
      console.error('Worker shutdown failed');
      process.exitCode = 1;
    } finally {
      clearTimeout(deadline);
    }
  };
  process.once('SIGINT', () => { void shutdown(); });
  process.once('SIGTERM', () => { void shutdown(); });
  try {
    await worker.waitUntilReady();
    if (!closing) console.log('Foundation worker connected; only synthetic probes are enabled');
  } catch {
    if (!closing) {
      process.exitCode = 1;
      await shutdown();
    }
  }
}

void main().catch(() => {
  console.error('Worker startup failed');
  process.exitCode = 1;
});
