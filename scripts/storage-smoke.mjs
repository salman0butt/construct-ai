import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const bucket = 'construct-ai-foundation';
function connection(raw, key) {
  if (!raw || /[\s\\?#]/.test(raw)) throw new Error('invalid_local_storage');
  const url = new URL(raw);
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(url.hostname) || !url.port || Number(url.port) < 1 || url.username || url.password || url.pathname !== '/') throw new Error('invalid_local_storage');
  url.hostname = '127.0.0.1';
  if (typeof key !== 'string' || /\s/.test(key)) throw new Error('invalid_key');
  const headers = { apikey: key };
  if (!/^sb_secret_[A-Za-z0-9_-]+$/.test(key)) {
    if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key) || JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'))?.role !== 'service_role') throw new Error('invalid_key');
    headers.authorization = 'Bearer ' + key;
  }
  return { origin: url.origin, headers };
}

export async function storageSmoke({ url, key }) {
  let config;
  try { config = connection(url, key); } catch { return { ok: false, reason: 'invalid_local_config' }; }
  const name = 'smoke-' + randomUUID() + '.txt';
  const payload = Buffer.from('ConstructAI synthetic storage probe ' + name);
  const path = '/storage/v1/object/' + bucket + '/' + name;
  const readPath = '/storage/v1/object/authenticated/' + bucket + '/' + name;
  const request = (path, init = {}) => fetch(config.origin + path, {
    ...init, headers: { ...config.headers, ...init.headers }, redirect: 'error', signal: AbortSignal.timeout(2000),
  });
  let uploaded = false;
  let attempted = false;
  let result = { ok: false, reason: 'bucket_check_failed' };
  try {
    const response = await request('/storage/v1/bucket/' + bucket);
    if (!response.ok) { await response.body?.cancel(); return result; }
    const meta = await response.json();
    if (meta?.id !== bucket || meta?.public !== false || (meta.versioning !== undefined && meta.versioning !== 'DISABLED')) return result;
    result = { ok: false, reason: 'upload_failed' };
    attempted = true;
    const upload = await request(path, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: payload });
    uploaded = upload.ok;
    await upload.body?.cancel();
    if (uploaded) {
      result = { ok: false, reason: 'download_failed' };
      const download = await request(readPath);
      if (download.ok && payload.equals(Buffer.from(await download.arrayBuffer()))) result = { ok: true };
      else await download.body?.cancel().catch(() => undefined);
    }
  } catch { /* Report stage, not raw error or credentials. */ }
  if (uploaded) {
    try {
      const removed = await request(path, { method: 'DELETE' });
      const deleted = removed.ok;
      await removed.body?.cancel();
      if (!deleted) throw new Error('delete_failed');
      const verify = await request(readPath);
      const missing = verify.status === 404;
      await verify.body?.cancel();
      if (!missing) throw new Error('delete_not_verified');
    } catch { return { ok: false, reason: 'cleanup_unverified', cleanupObject: name }; }
  } else if (attempted) {
    // A transport failure can be ambiguous; report the unique name for inspection.
    return { ...result, cleanupObject: name };
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await storageSmoke({ url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SECRET_KEY });
  console.log(JSON.stringify(result));
  process.exitCode = result.ok ? 0 : 1;
}
