import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getProjectDir, getPort } from '../src/lib/docker.js';

describe('getProjectDir', () => {
  it('returns a string path', () => {
    const dir = getProjectDir();
    assert.equal(typeof dir, 'string');
    assert.ok(dir.length > 0);
  });
});

describe('getPort', () => {
  it('returns default port 3002 when container not running', () => {
    const port = getPort();
    assert.equal(port, 3002);
  });
});
