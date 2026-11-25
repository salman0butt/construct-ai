import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateLocalConfig } from '../scripts/local-config.ts';

const valid = {
  DATABASE_URL: 'postgresql://app:local-password@127.0.0.1:54322/postgres',
  DATABASE_MIGRATION_URL: 'postgresql://migrator:local-password@localhost:54322/postgres?schema=construct_ai',
  DATABASE_SHADOW_URL: 'postgresql://migrator:shadow-password@localhost:54322/construct_ai_shadow',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
  SUPABASE_SECRET_KEY: 'sb_secret_example',
};
function rejects(variable: string, value: string | undefined) {
  const issues = validateLocalConfig({ ...valid, [variable]: value });
  assert.ok(issues.some(x => x.variable === variable), variable + ' must be rejected');
}

test('accepts all three valid distinct local connection settings', () => {
  assert.deepEqual(validateLocalConfig(valid), []);
});
test('requires a dedicated shadow database URL', () => {
  for (const value of [undefined, valid.DATABASE_MIGRATION_URL, 'postgresql://migrator:pw@remote.test:54322/construct_ai_shadow', 'postgresql://migrator:pw@localhost:54323/construct_ai_shadow', 'postgresql://app:pw@localhost:54322/construct_ai_shadow']) rejects('DATABASE_SHADOW_URL', value);
});
test('rejects same runtime and migration role even if encoded', () => {
  rejects('DATABASE_MIGRATION_URL', 'postgresql://%61pp:pw@localhost:54322/postgres');
});
test('rejects migration targeting another database or port', () => {
  rejects('DATABASE_MIGRATION_URL', 'postgresql://migrator:pw@localhost:54322/other');
  rejects('DATABASE_MIGRATION_URL', 'postgresql://migrator:pw@localhost:54323/postgres');
});
test('rejects missing passwords and decoded control characters', () => {
  rejects('DATABASE_URL', 'postgresql://app@localhost:54322/postgres');
  rejects('DATABASE_URL', 'postgresql://app:bad%0Apass@localhost:54322/postgres');
});
test('detects shadow URL exposure even through arbitrary public variable names', () => {
  rejects('NEXT_PUBLIC_CUSTOM', valid.DATABASE_SHADOW_URL);
  rejects('NEXT_PUBLIC_DATABASE_SHADOW_URL', 'not-the-same-value');
});
