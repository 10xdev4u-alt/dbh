import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('REPL module', () => {
  it('loads without error', async () => {
    const mod = await import('../src/repl/index.js');
    assert.ok(mod !== undefined);
    assert.equal(typeof mod.start, 'function');
  });
});
