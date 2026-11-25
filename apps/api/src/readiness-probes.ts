import { Client } from 'pg';
import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { databaseOptions, redisOptions, probeStorage } from './readiness-local';
import type { ReadinessProbes } from './readiness';

async function database(signal: AbortSignal): Promise<boolean> {
  const client = new Client({
    ...databaseOptions(process.env.DATABASE_URL),
    ssl: false,
    connectionTimeoutMillis: 1200,
    query_timeout: 1200,
    statement_timeout: 1000,
    options: '-c default_transaction_read_only=on',
  });
  client.on('error', () => { /* Return only the readiness state. */ });
  let closing: Promise<void> | undefined;
  const close = () => closing ??= client.end();
  const abort = () => { void close().catch(() => undefined); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    await client.connect();
    if (signal.aborted) return false;
    await client.query('SELECT 1 FROM construct_ai.foundation_probe LIMIT 1');
    return !signal.aborted;
  } finally {
    signal.removeEventListener('abort', abort);
    await close();
  }
}

async function redisProbe(signal: AbortSignal, worker: boolean): Promise<boolean> {
  const client = new IORedis({
    ...redisOptions(process.env.REDIS_URL),
    lazyConnect: true, connectTimeout: 1200, commandTimeout: 1200,
    maxRetriesPerRequest: 1, retryStrategy: () => null, enableOfflineQueue: false,
  });
  client.on('error', () => { /* Return only the readiness state. */ });
  const abort = () => client.disconnect();
  signal.addEventListener('abort', abort, { once: true });
  let queue: Queue | undefined;
  try {
    await client.connect();
    if (signal.aborted) return false;
    if (!worker) return await client.ping() === 'PONG';
    queue = new Queue('construct-ai-foundation', { connection: client });
    queue.on('error', () => { /* Return only the readiness state. */ });
    const count = await queue.getWorkersCount();
    return !signal.aborted && Number.isInteger(count) && count > 0;
  } finally {
    try {
      if (queue) await queue.close();
    } finally {
      signal.removeEventListener('abort', abort);
      client.disconnect();
    }
  }
}

export function localReadinessProbes(): ReadinessProbes {
  return {
    database,
    redis: signal => redisProbe(signal, false),
    storage: signal => probeStorage(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, signal),
    worker: signal => redisProbe(signal, true),
  };
}
