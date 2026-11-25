export const FOUNDATION_QUEUE = 'construct-ai-foundation';

export function parseRedisConnection(raw: string | undefined) {
  const match = /^redis:\/\/(?:127\.0\.0\.1|localhost)(?::([1-9]\d{0,4}))?(?:\/0?)?$/.exec(raw ?? 'redis://127.0.0.1:6379');
  const port = Number(match?.[1] ?? 6379);
  if (!match || port > 65535) {
    throw new Error('REDIS_URL must be a loopback redis:// URL with database 0 and no credentials');
  }
  return { host: '127.0.0.1', port, db: 0 };
}

export function processFoundationJob(name: string, data: unknown) {
  if (name !== 'foundation.ping') throw new Error('Unsupported foundation job');
  if (typeof data !== 'object' || data === null || Array.isArray(data) ||
      Object.keys(data).length !== 1 || !('nonce' in data) ||
      typeof data.nonce !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.nonce)) {
    throw new Error('Invalid foundation probe payload');
  }
  return { nonce: data.nonce, worker: 'construct-ai-worker' } as const;
}
