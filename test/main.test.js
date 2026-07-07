import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('main entry point', () => {
  it('exports run function', async () => {
    const mod = await import('../src/main.js');
    assert.equal(typeof mod.run, 'function');
  });
});
