import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { palette, c, badge } from '../src/ui/colors.js';

describe('palette', () => {
  it('has all required colors', () => {
    assert.ok(palette.accent);
    assert.ok(palette.green);
    assert.ok(palette.red);
    assert.ok(palette.yellow);
    assert.ok(palette.bg);
    assert.ok(palette.surface);
    assert.ok(palette.textMuted);
  });

  it('uses hex color format', () => {
    assert.match(palette.accent, /^#[0-9A-Fa-f]{6}$/);
    assert.match(palette.green, /^#[0-9A-Fa-f]{6}$/);
    assert.match(palette.red, /^#[0-9A-Fa-f]{6}$/);
  });
});

describe('badge', () => {
  it('exports all badge types', () => {
    assert.ok(badge.ok);
    assert.ok(badge.fail);
    assert.ok(badge.warn);
    assert.ok(badge.info);
  });
});

describe('c helpers', () => {
  it('exports color functions', () => {
    assert.ok(typeof c.accent === 'function');
    assert.ok(typeof c.green === 'function');
    assert.ok(typeof c.red === 'function');
    assert.ok(typeof c.dim === 'function');
  });
});
