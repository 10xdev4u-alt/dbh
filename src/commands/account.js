import enquirer from 'enquirer';
import { c, badge, palette } from '../ui/colors.js';
import { createTable, kvLine } from '../ui/format.js';
import { api } from '../lib/http.js';
import { readEnv, writeEnv, parseAccounts } from '../lib/config.js';

// ── Shared helpers ───────────────────────────────────────
const BASE = 'http://localhost:3002';

function apiKey() {
  const env = readEnv();
  const keys = parseApiKeys(env.API_KEYS);
  return keys[0] || null;
}

function authHeaders() {
  const key = apiKey();
  return key ? { Authorization: `Bearer ${key}` } : {};
}

async function getList() {
  const res = await fetch(`${BASE}/api/accounts`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text().catch(() => '')}`);
  return res.json();
}

// ── List accounts ─────────────────────────────────────────
async function list() {
  console.log();
  try {
    const data = await getList();
    const list = data.accounts || [];

    if (list.length === 0) {
      console.log(`  ${c.dim('No accounts configured.')}`);
      console.log(`  ${c.dim('Add one:')} ${c.accent('dbh account add')}\n`);
      return;
    }

    const table = createTable(['Email', 'Status', 'Last Checked', 'Error']);
    for (const a of list) {
      const statusIcon = a.status === 'active' ? c.green('●') : a.status === 'banned' ? c.red('●') : a.status === 'failed' ? c.yellow('●') : c.dim('○');
      const statusStr = `${statusIcon} ${c.dim(a.status)}`;
      const lastChecked = a.lastChecked ? new Date(a.lastChecked).toLocaleString() : c.dim('—');
      const error = a.error ? c.red(a.error.slice(0, 40)) : c.dim('—');
      table.push([a.emailMasked || a.email, statusStr, lastChecked, error]);
    }
    console.log(`  ${c.dim(`${list.length} account(s)`)}`);
    console.log(table.toString());
    console.log();
  } catch (err) {
    console.error(`  ${c.red('✘')} ${err.message}\n`);
    process.exit(1);
  }
}

// ── Add account ───────────────────────────────────────────
async function add() {
  console.log();
  const { email, password } = await enquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Account email',
      validate: (v) => v.includes('@') ? true : 'Enter a valid email',
    },
    {
      type: 'password',
      name: 'password',
      message: 'Password (leave blank to use email as password)',
    },
  ]);

  const env = readEnv();
  const existing = parseAccounts(env.DEEPSEEK_ACCOUNTS);
  existing.push({ email, password: password || email });
  writeEnv({ DEEPSEEK_ACCOUNTS: JSON.stringify(existing) });

  console.log(`\n  ${badge.ok} ${c.green('Account added to .env')}`);
  console.log(`  ${c.dim('Restart to apply:')} ${c.accent('dbh restart')}\n`);
}

// ── Remove account ────────────────────────────────────────
async function remove(email) {
  const env = readEnv();
  let accounts = parseAccounts(env.DEEPSEEK_ACCOUNTS);
  const idx = accounts.findIndex(a => a.email === email);

  if (idx === -1) {
    console.error(`\n  ${c.red('✘')} Account not found: ${email}\n`);
    process.exit(1);
  }

  accounts.splice(idx, 1);
  writeEnv({ DEEPSEEK_ACCOUNTS: accounts.length ? JSON.stringify(accounts) : '[]' });

  console.log(`\n  ${badge.ok} ${c.accent(`Removed ${email}`)}`);
  console.log(`  ${c.dim('Restart to apply:')} ${c.accent('dbh restart')}\n`);
}

// ── Test account ──────────────────────────────────────────
async function test(email) {
  const encoded = encodeURIComponent(email);
  console.log();

  try {
    const res = await fetch(`${BASE}/api/accounts/${encoded}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    });
    const data = await res.json();

    if (data.success) {
      console.log(`  ${badge.ok} ${c.green(email)} ${c.dim('— login successful')}`);
    } else {
      console.log(`  ${badge.fail} ${c.red(email)} ${c.dim('—')} ${c.yellow(data.error || 'login failed')}`);
      if (data.isBanned) console.log(`  ${c.dim('Account is banned')}`);
    }
    console.log();
  } catch (err) {
    console.error(`  ${c.red('✘')} ${err.message}\n`);
    process.exit(1);
  }
}

export default { list, add, remove, test };
