import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getHealth, parseApiPort } from '../src/health.ts';

test('health reports liveness only', () => {
  assert.deepEqual(getHealth(), { service: 'construct-ai-api', status: 'ok', check: 'liveness' });
});

test('port defaults to 4000 and accepts an explicit valid port', () => {
  assert.equal(parseApiPort(undefined), 4000);
  assert.equal(parseApiPort('4500'), 4500);
});

test('port rejects invalid or ambiguous values', () => {
  for (const value of ['', '0', '-1', '65536', '4e3', ' 4000', '4000.5', 'abc']) {
    assert.throws(() => parseApiPort(value), /API_PORT/);
  }
});
