import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Test that all command modules can be imported
const CMD_MODULES = [
  '../src/commands/init.js',
  '../src/commands/up.js',
  '../src/commands/down.js',
  '../src/commands/logs.js',
  '../src/commands/restart.js',
  '../src/commands/status.js',
  '../src/commands/url.js',
  '../src/commands/health.js',
  '../src/commands/account.js',
  '../src/commands/key.js',
  '../src/commands/config.js',
  '../src/commands/backup.js',
  '../src/commands/update.js',
  '../src/commands/doctor.js',
];

describe('command modules', () => {
  for (const modPath of CMD_MODULES) {
    it(`loads ${modPath.split('/').pop()}`, async () => {
      const mod = await import(modPath);
      assert.ok(mod !== undefined);
    });
  }
});
