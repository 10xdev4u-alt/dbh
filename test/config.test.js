import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseAccounts, parseApiKeys, findProxyDir, checkDocker } from '../src/lib/config.js';

describe('parseAccounts', () => {
  it('parses JSON array of accounts', () => {
    const raw = '[{"email":"a@b.com","password":"pass"}]';
    const result = parseAccounts(raw);
    assert.equal(result.length, 1);
    assert.equal(result[0].email, 'a@b.com');
  });

  it('parses pipe-separated accounts', () => {
    const raw = 'a@b.com|pass1';
    const result = parseAccounts(raw);
    assert.equal(result.length, 1);
    assert.equal(result[0].email, 'a@b.com');
  });

  it('returns empty array for undefined', () => {
    assert.deepEqual(parseAccounts(undefined), []);
  });

  it('returns empty array for empty string', () => {
    assert.deepEqual(parseAccounts(''), []);
  });
});

describe('parseApiKeys', () => {
  it('parses JSON array of keys', () => {
    const raw = '["sk-111","sk-222"]';
    const result = parseApiKeys(raw);
    assert.equal(result.length, 2);
    assert.equal(result[0], 'sk-111');
  });

  it('parses comma-separated keys', () => {
    const raw = 'sk-111,sk-222';
    const result = parseApiKeys(raw);
    assert.equal(result.length, 2);
  });

  it('returns empty array for undefined', () => {
    assert.deepEqual(parseApiKeys(undefined), []);
  });
});
