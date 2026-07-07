import enquirer from 'enquirer';
import { c, badge } from '../ui/colors.js';
import { createTable } from '../ui/format.js';
import { readEnv, writeEnv, parseApiKeys } from '../lib/config.js';
import { api } from '../lib/http.js';

// ── List API keys ─────────────────────────────────────────
async function list() {
  console.log();
  const env = readEnv();
  const keys = parseApiKeys(env.API_KEYS);

  if (keys.length === 0) {
    console.log(`  ${c.dim('No API keys configured. Requests will not require auth.')}`);
    console.log(`  ${c.dim('Add one:')} ${c.accent('dbh key add')}\n`);
    return;
  }

  const table = createTable(['#', 'Key', 'Prefix']);
  keys.forEach((k, i) => {
    const prefix = k.length > 12 ? k.slice(0, 8) + '…' : k;
    table.push([String(i + 1), c.accent(k), c.dim(prefix)]);
  });
  console.log(`  ${c.dim(`${keys.length} API key(s)`)}`);
  console.log(table.toString());
  console.log();
}

// ── Add API key ───────────────────────────────────────────
async function add() {
  console.log();
  const { key } = await enquirer.prompt({
    type: 'input',
    name: 'key',
    message: 'API key (e.g. sk-yourkey)',
    validate: (v) => v.trim().length >= 4 ? true : 'Key must be at least 4 characters',
  });

  const env = readEnv();
  const existing = parseApiKeys(env.API_KEYS);
  const trimmed = key.trim();
  if (existing.includes(trimmed)) {
    console.log(`\n  ${c.yellow('⚠')} Key already exists\n`);
    return;
  }

  existing.push(trimmed);
  writeEnv({ API_KEYS: JSON.stringify(existing) });

  console.log(`\n  ${badge.ok} ${c.green('API key added')}`);
  console.log(`  ${c.dim('Restart to apply:')} ${c.accent('dbh restart')}\n`);
}

// ── Remove API key ────────────────────────────────────────
async function remove(keyVal) {
  const env = readEnv();
  let keys = parseApiKeys(env.API_KEYS);
  const idx = keys.indexOf(keyVal);

  if (idx === -1) {
    console.error(`\n  ${c.red('✘')} Key not found\n`);
    process.exit(1);
  }

  keys.splice(idx, 1);
  writeEnv({ API_KEYS: keys.length ? JSON.stringify(keys) : '[]' });

  console.log(`\n  ${badge.ok} ${c.accent('Key removed')}`);
  console.log(`  ${c.dim('Restart to apply:')} ${c.accent('dbh restart')}\n`);
}

export default { list, add, remove };
