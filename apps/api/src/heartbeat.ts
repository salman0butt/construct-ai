export const WORKER_HEARTBEAT_KEY = 'construct-ai:foundation:worker-heartbeat:v1';

export function workerLeaseIsFresh(count: number, ttl: number): boolean {
  return Number.isInteger(count) && count > 0 && Number.isInteger(ttl) && ttl > 0 && ttl <= 15000;
}
