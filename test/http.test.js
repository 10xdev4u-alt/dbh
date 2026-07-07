import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCachedProxyUrl, resetProxyUrl } from '../src/lib/http.js';

describe('getCachedProxyUrl', () => {
  it('returns a URL string', () => {
    const url = getCachedProxyUrl();
    assert.equal(typeof url, 'string');
    assert.ok(url.startsWith('http'));
  });
});

describe('resetProxyUrl', () => {
  it('clears cached URL', () => {
    resetProxyUrl();
    const url = getCachedProxyUrl();
    assert.ok(url.startsWith('http'));
  });
});
