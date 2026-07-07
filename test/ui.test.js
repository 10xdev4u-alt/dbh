import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createTable } from '../src/ui/format.js';

describe('createTable', () => {
  it('creates a table with headers', () => {
    const table = createTable(['Name', 'Value']);
    table.push(['foo', 'bar']);
    const output = table.toString();
    assert.ok(output.includes('NAME'));
    assert.ok(output.includes('VALUE'));
    assert.ok(output.includes('foo'));
    assert.ok(output.includes('bar'));
  });

  it('handles empty rows', () => {
    const table = createTable(['A', 'B']);
    const output = table.toString();
    assert.ok(output.includes('A'));
    assert.ok(output.includes('B'));
  });
});
