import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { getBackupDir, listBackups } from '../src/lib/backup.js';

describe('getBackupDir', () => {
  it('returns a path string', () => {
    const dir = getBackupDir();
    assert.equal(typeof dir, 'string');
    assert.ok(dir.includes('.dbh'));
  });
});

describe('listBackups', () => {
  it('returns an array', () => {
    const result = listBackups();
    assert.ok(Array.isArray(result));
  });
});
