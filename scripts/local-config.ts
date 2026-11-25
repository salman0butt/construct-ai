export type ConfigIssue = { variable: string; message: string };
type Env = Record<string, string | undefined>;

function parsed(raw: string | undefined): URL | undefined {
  if (!raw || /[\s\\]/.test(raw) || raw.includes('#')) return undefined;
  try { return new URL(raw); } catch { return undefined; }
}

function localHost(url: URL): boolean {
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
}

function localDatabase(raw: string | undefined): boolean {
  const url = parsed(raw);
  return !!url && (url.protocol === 'postgres:' || url.protocol === 'postgresql:') &&
    localHost(url) && !!url.port && Number(url.port) > 0 && !!url.username &&
    /^\/[A-Za-z0-9_-]+$/.test(url.pathname) &&
    (!raw?.includes('?') || url.search === '?schema=construct_ai');
}

function localHttp(raw: string | undefined): boolean {
  const url = parsed(raw);
  return !!url && url.protocol === 'http:' && localHost(url) &&
    !!url.port && Number(url.port) > 0 && !url.username && !url.password && url.pathname === '/' &&
    !raw?.includes('?');
}

function localRedis(raw: string): boolean {
  const match = /^redis:\/\/(?:127\.0\.0\.1|localhost)(?::([1-9]\d{0,4}))?(?:\/0?)?$/.exec(raw);
  return !!match && Number(match[1] ?? 6379) <= 65535;
}

function keyMatches(raw: string | undefined, kind: 'publishable' | 'secret'): boolean {
  if (!raw || /\s/.test(raw)) return false;
  // Local CLI may still emit legacy JWT keys. This is a shape check only,
  // never authentication or authorization; the running service verifies keys.
  if (raw.startsWith(`sb_${kind}_`) && raw.length > `sb_${kind}_`.length) return true;
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(raw)) return false;
  try {
    const payload: unknown = JSON.parse(Buffer.from(raw.split('.')[1] ?? '', 'base64url').toString('utf8'));
    return typeof payload === 'object' && payload !== null && 'role' in payload &&
      payload.role === (kind === 'publishable' ? 'anon' : 'service_role');
  } catch { return false; }
}

export function validateLocalConfig(env: Env): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const require = (ok: boolean, variable: string, message: string) => {
    if (!ok) issues.push({ variable, message });
  };
  for (const name of ['DATABASE_URL', 'DATABASE_MIGRATION_URL']) {
    require(localDatabase(env[name]), name, 'Use a loopback PostgreSQL URI with explicit port and no connection overrides; only schema=construct_ai is allowed.');
  }
  require(localHttp(env.SUPABASE_URL), 'SUPABASE_URL', 'Use the local HTTP origin and explicit port from Supabase CLI.');
  require(keyMatches(env.SUPABASE_PUBLISHABLE_KEY, 'publishable'), 'SUPABASE_PUBLISHABLE_KEY', 'Use the local publishable or legacy anon key.');
  require(keyMatches(env.SUPABASE_SECRET_KEY, 'secret') && env.SUPABASE_SECRET_KEY !== env.SUPABASE_PUBLISHABLE_KEY, 'SUPABASE_SECRET_KEY', 'Use a distinct local server-only secret or legacy service-role key.');
  require(localRedis(env.REDIS_URL ?? 'redis://127.0.0.1:6379'), 'REDIS_URL', 'Use the loopback Redis profile with database 0 and no credentials.');
  for (const name of ['ALLOW_EXTERNAL_AI', 'ALLOW_EXTERNAL_INTEGRATIONS']) {
    require((env[name] ?? 'false') === 'false', name, 'External operations must remain disabled during local foundation.');
  }
  const provider = env.AI_PROVIDER ?? 'mock';
  require(provider === 'mock' || provider === 'ollama', 'AI_PROVIDER', 'Only mock or local Ollama is supported in this foundation profile.');
  if (provider === 'ollama' || env.OLLAMA_BASE_URL !== undefined) {
    require(localHttp(env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434'), 'OLLAMA_BASE_URL', 'Use a loopback HTTP origin with explicit port.');
  }
  const secrets = [env.SUPABASE_SECRET_KEY, env.DATABASE_URL, env.DATABASE_MIGRATION_URL, env.OPENAI_API_KEY, env.GOOGLE_GENERATIVE_AI_API_KEY].filter((value): value is string => !!value);
  for (const [name, value] of Object.entries(env)) {
    if (name.startsWith('NEXT_PUBLIC_') && (/(?:SECRET|SERVICE_ROLE|DATABASE_URL|API_KEY|PASSWORD)/.test(name) || !!value && secrets.some(secret => value.includes(secret)))) {
      issues.push({ variable: name, message: 'Remove server-only values from public client configuration.' });
    }
  }
  return issues;
}
