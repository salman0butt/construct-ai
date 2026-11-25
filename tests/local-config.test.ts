import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateLocalConfig } from '../scripts/local-config.ts';

const valid = {
  DATABASE_URL: 'postgresql://app:local-password@127.0.0.1:54322/postgres',
  DATABASE_MIGRATION_URL: 'postgresql://migrator:local-password@localhost:54322/postgres?schema=construct_ai',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
  SUPABASE_SECRET_KEY: 'sb_secret_example',
  REDIS_URL: 'redis://127.0.0.1:6379',
};

function rejects(key: string, value: string) {
  const issues = validateLocalConfig({ ...valid, [key]: value });
  assert.ok(issues.some(issue => issue.variable === key), `${key} must be rejected`);
}

test('accepts valid local services with external providers disabled by default', () => {
  assert.deepEqual(validateLocalConfig(valid), []);
});

test('reports missing required database, API and key configuration', () => {
  const missing = validateLocalConfig({}).map(issue => issue.variable);
  for (const key of ['DATABASE_URL', 'DATABASE_MIGRATION_URL', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY']) {
    assert.ok(missing.includes(key));
  }
});

test('rejects hosted PostgreSQL and URI parameters that override connection targets', () => {
  for (const value of [
    'postgresql://app:pw@db.example.com:5432/postgres',
    'postgresql://app:pw@localhost:54322/postgres?host=db.example.com',
    'postgresql://app:pw@localhost:54322/postgres?schema=construct_ai&host=evil.test',
    'postgresql://app:pw@localhost:54322/postgres#fragment',
    'postgresql://app:pw@localhost/postgres',
    'postgresql://app:pw@localhost:54322/postgres?schema=public',
  ]) rejects('DATABASE_URL', value);
  rejects('DATABASE_MIGRATION_URL', 'postgresql://app:pw@db.example.com:5432/postgres');
});

test('rejects nonlocal or ambiguous Supabase endpoints', () => {
  for (const value of ['https://example.supabase.co', 'http://localhost:54321@evil.test', 'http://localhost:54321/storage/v1', 'http://localhost:54321?x=1', 'http://localhost:54321/#x', 'http://localhost:54321\\@evil.test']) rejects('SUPABASE_URL', value);
});

test('rejects nonlocal and authenticated Redis URLs for the local-only profile', () => {
  for (const value of ['redis://evil.test:6379', 'redis://user:pw@localhost:6379', 'redis://localhost:6379/2', 'redis://localhost:99999']) rejects('REDIS_URL', value);
});

test('rejects external AI and integration settings during foundation', () => {
  rejects('ALLOW_EXTERNAL_AI', 'true');
  rejects('ALLOW_EXTERNAL_INTEGRATIONS', 'true');
  rejects('AI_PROVIDER', 'openai');
  rejects('AI_PROVIDER', 'gemini');
});

test('allows optional local Ollama and rejects hosted Ollama', () => {
  assert.deepEqual(validateLocalConfig({ ...valid, AI_PROVIDER: 'ollama', OLLAMA_BASE_URL: 'http://localhost:11434' }), []);
  const issues = validateLocalConfig({ ...valid, AI_PROVIDER: 'ollama', OLLAMA_BASE_URL: 'https://ollama.example.com' });
  assert.ok(issues.some(issue => issue.variable === 'OLLAMA_BASE_URL'));
});

test('rejects swapped or duplicated keys and secrets in public client variables', () => {
  rejects('SUPABASE_PUBLISHABLE_KEY', 'sb_secret_example');
  rejects('SUPABASE_SECRET_KEY', 'sb_publishable_example');
  const issues = validateLocalConfig({ ...valid, NEXT_PUBLIC_CUSTOM: valid.SUPABASE_SECRET_KEY, NEXT_PUBLIC_DATABASE_URL: valid.DATABASE_URL });
  assert.deepEqual(issues.map(issue => issue.variable).sort(), ['NEXT_PUBLIC_CUSTOM', 'NEXT_PUBLIC_DATABASE_URL']);
});

test('diagnostics never include credential values', () => {
  const secret = 'must-not-appear-in-diagnostics';
  const issues = validateLocalConfig({ ...valid, DATABASE_URL: `postgresql://app:${secret}@evil.test:5432/db`, NEXT_PUBLIC_SECRET: valid.SUPABASE_SECRET_KEY });
  assert.ok(issues.length > 0);
  const serialized = JSON.stringify(issues);
  assert.ok(!serialized.includes(secret));
  assert.ok(!serialized.includes(valid.SUPABASE_SECRET_KEY));
});

test('rejects legacy service-role JWT in the publishable slot and anon JWT in the secret slot', () => {
  const legacy = (role: string) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.synthetic-signature`;
  assert.deepEqual(validateLocalConfig({ ...valid, SUPABASE_PUBLISHABLE_KEY: legacy('anon'), SUPABASE_SECRET_KEY: legacy('service_role') }), []);
  rejects('SUPABASE_PUBLISHABLE_KEY', legacy('service_role'));
  rejects('SUPABASE_SECRET_KEY', legacy('anon'));
  rejects('SUPABASE_PUBLISHABLE_KEY', 'a.b.c');
});

test('rejects port zero in local HTTP configuration', () => {
  rejects('SUPABASE_URL', 'http://localhost:0');
});
