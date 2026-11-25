import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runtimeConnection, migrationConnections } from '../src/connections.ts';

const env = {
  DATABASE_URL: 'postgresql://app:local%3Asecret@localhost:54322/postgres',
  DATABASE_MIGRATION_URL: 'postgresql://migrator:local@127.0.0.1:54322/postgres?schema=construct_ai',
  DATABASE_SHADOW_URL: 'postgresql://migrator:local@localhost:54322/construct_ai_shadow',
};

test('runtime uses only runtime credentials and normalizes to loopback', () => {
  assert.equal(runtimeConnection({ DATABASE_URL: env.DATABASE_URL }), 'postgresql://app:local%3Asecret@127.0.0.1:54322/postgres');
});

test('runtime rejects remote, malformed and connection-overriding URLs', () => {
  for (const uri of [undefined, '', 'postgresql://app:secret@remote.example:5432/postgres', 'postgresql://app:secret@localhost:54322/postgres?host=evil.test', 'postgresql://app:secret@localhost:54322/postgres?schema=public', 'postgresql://app:secret@localhost:0/postgres', 'postgresql://app@localhost:54322/postgres']) {
    assert.throws(() => runtimeConnection({ DATABASE_URL: uri }), /DATABASE_URL/);
  }
});

test('migration targets the private schema and a dedicated shadow database', () => {
  assert.deepEqual(migrationConnections(env), {
    url: 'postgresql://migrator:local@127.0.0.1:54322/postgres?schema=construct_ai',
    shadowDatabaseUrl: 'postgresql://migrator:local@127.0.0.1:54322/construct_ai_shadow?schema=construct_ai',
  });
});

test('migration role must differ from runtime role even when encoded', () => {
  assert.throws(() => migrationConnections({ ...env, DATABASE_MIGRATION_URL: 'postgresql://%61pp:other@localhost:54322/postgres' }), /distinct/);
});

test('migration and runtime must target the same database and port', () => {
  for (const uri of ['postgresql://migrator:local@localhost:54322/other', 'postgresql://migrator:local@localhost:54323/postgres']) {
    assert.throws(() => migrationConnections({ ...env, DATABASE_MIGRATION_URL: uri }), /same local database/);
  }
});

test('shadow cannot target the application database or an unrelated database', () => {
  for (const uri of [undefined, env.DATABASE_MIGRATION_URL, 'postgresql://migrator:local@localhost:54322/other', 'postgresql://migrator:local@localhost:54323/construct_ai_shadow', 'postgresql://app:local@localhost:54322/construct_ai_shadow']) {
    assert.throws(() => migrationConnections({ ...env, DATABASE_SHADOW_URL: uri }), /DATABASE_SHADOW_URL/);
  }
});

test('error messages never reveal credentials', () => {
  assert.throws(() => runtimeConnection({ DATABASE_URL: 'postgresql://app:unique-secret@evil.test:5432/postgres' }), error => error instanceof Error && !error.message.includes('unique-secret'));
});
