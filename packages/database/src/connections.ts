type Env = Record<string, string | undefined>;
const SCHEMA = 'construct_ai';

function parseConnection(env: Env, name: string): URL {
  const raw = env[name];
  const invalid = () => new Error(`${name} must be a credentialed loopback PostgreSQL URL with an explicit port and optional schema=construct_ai`);
  if (!raw || /[\s\\#]/.test(raw)) throw invalid();
  let url: URL;
  try {
    url = new URL(raw);
    const user = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
        !['127.0.0.1', 'localhost'].includes(url.hostname) || !url.port || Number(url.port) < 1 ||
        !/^[A-Za-z_][A-Za-z0-9_-]*$/.test(user) || !password || /[\x00-\x1f\x7f]/.test(password) ||
        !/^\/[A-Za-z0-9_-]+$/.test(url.pathname) || (raw.includes('?') && url.search !== '?schema=construct_ai')) throw invalid();
  } catch { throw invalid(); }
  url.hostname = '127.0.0.1';
  return url;
}

export function runtimeConnection(env: Env): string {
  const url = parseConnection(env, 'DATABASE_URL');
  url.search = '';
  return url.toString();
}

export function migrationConnections(env: Env) {
  const runtime = parseConnection(env, 'DATABASE_URL');
  const migration = parseConnection(env, 'DATABASE_MIGRATION_URL');
  const shadow = parseConnection(env, 'DATABASE_SHADOW_URL');
  if (decodeURIComponent(runtime.username) === decodeURIComponent(migration.username)) {
    throw new Error('Runtime and migration roles must be distinct');
  }
  if (runtime.port !== migration.port || runtime.pathname !== migration.pathname) {
    throw new Error('Runtime and migration must target the same local database');
  }
  if (shadow.port !== migration.port || shadow.pathname !== '/construct_ai_shadow' ||
      shadow.pathname === migration.pathname || decodeURIComponent(shadow.username) !== decodeURIComponent(migration.username)) {
    throw new Error('DATABASE_SHADOW_URL must target the dedicated construct_ai_shadow database with the migration role');
  }
  migration.search = shadow.search = `?schema=${SCHEMA}`;
  return { url: migration.toString(), shadowDatabaseUrl: shadow.toString() };
}
