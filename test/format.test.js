import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { kvLine, statusLine, section, wrapText } from '../src/ui/format.js';

describe('format utilities', () => {
  it('kvLine exists', () => {
    assert.equal(typeof kvLine, 'function');
  });

  it('statusLine exists', () => {
    assert.equal(typeof statusLine, 'function');
  });

  it('section exists', () => {
    assert.equal(typeof section, 'function');
  });

  it('wrapText exists', () => {
    assert.equal(typeof wrapText, 'function');
  });
});
