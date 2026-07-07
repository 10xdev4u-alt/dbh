import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

// Import module
let parseAccounts, parseApiKeys, findProxyDir, loadDotEnv, readEnv, writeEnv, checkDocker, checkDockerCompose;
before(async () => {
  const mod = await import('../src/lib/config.js');
  parseAccounts = mod.parseAccounts;
  parseApiKeys = mod.parseApiKeys;
  findProxyDir = mod.findProxyDir;
  loadDotEnv = mod.loadDotEnv;
  readEnv = mod.readEnv;
  writeEnv = mod.writeEnv;
  checkDocker = mod.checkDocker;
  checkDockerCompose = mod.checkDockerCompose;
});

describe('parseAccounts', () => {
  it('parses JSON array of accounts', () => {
    const raw = '[{"email":"a@b.com","password":"pass"}]';
    const result = parseAccounts(raw);
    assert.equal(result.length, 1);
    assert.equal(result[0].email, 'a@b.com');
    assert.equal(result[0].password, 'pass');
  });

  it('parses multiple JSON accounts', () => {
    const raw = '[{"email":"a@b.com","password":"pass1"},{"email":"c@d.com","password":"pass2"}]';
    const result = parseAccounts(raw);
    assert.equal(result.length, 2);
    assert.equal(result[1].email, 'c@d.com');
  });

  it('parses pipe-separated accounts', () => {
    const raw = 'a@b.com|pass1';
    const result = parseAccounts(raw);
    assert.equal(result.length, 1);
    assert.equal(result[0].email, 'a@b.com');
    assert.equal(result[0].password, 'pass1');
  });

  it('parses comma-separated pipe accounts', () => {
    const raw = 'a@b.com|pass1,c@d.com|pass2';
    const result = parseAccounts(raw);
    assert.equal(result.length, 2);
    assert.equal(result[1].email, 'c@d.com');
  });

  it('parses email-only accounts (empty password)', () => {
    const raw = 'a@b.com';
    const result = parseAccounts(raw);
    assert.equal(result.length, 1);
    assert.equal(result[0].email, 'a@b.com');
    assert.equal(result[0].password, '');
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
    assert.equal(result[1], 'sk-222');
  });

  it('parses comma-separated keys', () => {
    const raw = 'sk-111,sk-222';
    const result = parseApiKeys(raw);
    assert.equal(result.length, 2);
    assert.equal(result[0], 'sk-111');
  });

  it('trims whitespace from keys', () => {
    const raw = ' sk-111 , sk-222 ';
    const result = parseApiKeys(raw);
    assert.equal(result.length, 2);
    assert.equal(result[1], 'sk-222');
  });

  it('returns empty array for undefined', () => {
    assert.deepEqual(parseApiKeys(undefined), []);
  });

  it('returns empty array for empty string', () => {
    assert.deepEqual(parseApiKeys(''), []);
  });
});

describe('loadDotEnv', () => {
  let tmpDir;
  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'dbh-test-'));
  });
  after(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty object for missing .env', () => {
    const result = loadDotEnv(tmpDir);
    assert.deepEqual(result, {});
  });

  it('parses simple key=value', () => {
    writeFileSync(join(tmpDir, '.env'), 'FOO=bar\nBAZ=qux\n');
    const result = loadDotEnv(tmpDir);
    assert.equal(result.FOO, 'bar');
    assert.equal(result.BAZ, 'qux');
  });

  it('skips comments and blank lines', () => {
    writeFileSync(join(tmpDir, '.env'), '# comment\n\nFOO=bar\n');
    const result = loadDotEnv(tmpDir);
    assert.equal(result.FOO, 'bar');
    assert.equal(Object.keys(result).length, 1);
  });

  it('strips quotes from values', () => {
    writeFileSync(join(tmpDir, '.env'), 'FOO="bar"\nBAZ=\'qux\'\n');
    const result = loadDotEnv(tmpDir);
    assert.equal(result.FOO, 'bar');
    assert.equal(result.BAZ, 'qux');
  });

  it('trims whitespace', () => {
    writeFileSync(join(tmpDir, '.env'), '  FOO =  bar  \n');
    const result = loadDotEnv(tmpDir);
    assert.equal(result.FOO, 'bar');
  });
});

describe('findProxyDir', () => {
  let tmpDir;
  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'dbh-test-'));
  });
  after(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns null for empty directory', () => {
    const result = findProxyDir(tmpDir);
    assert.equal(result, null);
  });

  it('finds docker-compose.yml', () => {
    writeFileSync(join(tmpDir, 'docker-compose.yml'), 'version: "3"\n');
    const result = findProxyDir(tmpDir, 0);
    assert.equal(result, tmpDir);
  });

  it('finds Dockerfile', () => {
    rmSync(join(tmpDir, 'docker-compose.yml'));
    writeFileSync(join(tmpDir, 'Dockerfile'), 'FROM node\n');
    const result = findProxyDir(tmpDir, 0);
    assert.equal(result, tmpDir);
  });

  it('searches parent directories', () => {
    rmSync(join(tmpDir, 'Dockerfile'));
    const subDir = join(tmpDir, 'sub', 'deep');
    mkdirSync(subDir, { recursive: true });
    writeFileSync(join(tmpDir, 'docker-compose.yml'), 'version: "3"\n');
    const result = findProxyDir(subDir, 0);
    assert.equal(result, tmpDir);
  });

  it('stops at depth limit', () => {
    const result = findProxyDir('/tmp', 11);
    assert.equal(result, null);
  });
});

describe('checkDocker', () => {
  it('returns boolean (does not throw)', async () => {
    const result = await checkDocker();
    assert.ok(typeof result === 'boolean');
  });
});

describe('readEnv / writeEnv', () => {
  let tmpDir;
  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'dbh-test-'));
  });
  after(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes and reads back environment', () => {
    writeEnv({ FOO: 'bar', BAZ: 'qux' }, tmpDir);
    const result = readEnv(tmpDir);
    assert.equal(result.FOO, 'bar');
    assert.equal(result.BAZ, 'qux');
  });

  it('merges with existing values', () => {
    writeEnv({ FOO: 'bar' }, tmpDir);
    writeEnv({ BAZ: 'qux' }, tmpDir);
    const result = readEnv(tmpDir);
    assert.equal(result.FOO, 'bar');
    assert.equal(result.BAZ, 'qux');
  });
});
