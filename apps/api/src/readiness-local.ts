export function databaseOptions(raw: string | undefined) {
  const invalid = () => new Error('Invalid local DATABASE_URL');
  if (!raw || /[\s\\#]/.test(raw)) throw invalid();
  try {
    const url = new URL(raw);
    const user = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
        !['localhost', '127.0.0.1'].includes(url.hostname) || !url.port || Number(url.port) < 1 ||
        !/^[A-Za-z_][A-Za-z0-9_-]*$/.test(user) || !password || /[\x00-\x1f\x7f]/.test(password) ||
        !/^\/[A-Za-z0-9_-]+$/.test(url.pathname) || (raw.includes('?') && url.search !== '?schema=construct_ai')) throw invalid();
    return { host: '127.0.0.1', port: Number(url.port), database: url.pathname.slice(1), user, password };
  } catch { throw invalid(); }
}

export function redisOptions(raw: string | undefined) {
  const match = /^redis:\/\/(?:127\.0\.0\.1|localhost)(?::([1-9]\d{0,4}))?(?:\/0?)?$/.exec(raw ?? 'redis://127.0.0.1:6379');
  const port = Number(match?.[1] ?? 6379);
  if (!match || port > 65535) throw new Error('Invalid local REDIS_URL');
  return { host: '127.0.0.1', port, db: 0 };
}

function storageHeaders(key: string | undefined): Record<string, string> | undefined {
  if (!key || /\s/.test(key)) return undefined;
  if (/^sb_secret_[A-Za-z0-9_-]+$/.test(key)) return { apikey: key };
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) return undefined;
  try {
    const claims: unknown = JSON.parse(Buffer.from(key.split('.')[1] ?? '', 'base64url').toString('utf8'));
    if (typeof claims === 'object' && claims !== null && 'role' in claims && claims.role === 'service_role') {
      return { apikey: key, authorization: `Bearer ${key}` };
    }
  } catch { /* Shape validation only; service authenticates the key. */ }
  return undefined;
}

export async function probeStorage(raw: string | undefined, key: string | undefined, signal: AbortSignal): Promise<boolean> {
  if (!raw || /[\s\\?#]/.test(raw)) return false;
  const headers = storageHeaders(key);
  if (!headers) return false;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(url.hostname) || !url.port || Number(url.port) < 1 || url.username || url.password || url.pathname !== '/') return false;
    url.hostname = '127.0.0.1';
    url.pathname = '/storage/v1/bucket/construct-ai-foundation';
    const response = await fetch(url, { headers, signal, redirect: 'error' });
    if (!response.ok) { await response.body?.cancel(); return false; }
    const body: unknown = await response.json();
    return typeof body === 'object' && body !== null && 'id' in body && body.id === 'construct-ai-foundation' && 'public' in body && body.public === false;
  } catch { return false; }
}
