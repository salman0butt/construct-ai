const KEY = 'construct-ai:foundation:worker-heartbeat:v1';
const TTL_MS = 15000;
type WriteLease = (key: string, value: string, ttlMs: number) => Promise<unknown>;

export function createHeartbeat(writeLease: WriteLease, isRunning: () => boolean) {
  let stopped = false;
  let pending: Promise<void> | undefined;
  return {
    pulse(): Promise<void> {
      if (stopped || !isRunning()) return Promise.resolve();
      if (!pending) {
        pending = Promise.resolve().then(async () => {
          if (!stopped && isRunning()) await writeLease(KEY, 'alive', TTL_MS);
        }).finally(() => { pending = undefined; });
      }
      return pending;
    },
    stop() { stopped = true; },
  };
}
