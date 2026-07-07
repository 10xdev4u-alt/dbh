import enquirer from 'enquirer';
import { c, badge, palette } from '../ui/colors.js';
import { createTable, kvGrid, section } from '../ui/format.js';
import { readEnv, writeEnv } from '../lib/config.js';

// ── Show config ───────────────────────────────────────────
async function show() {
  console.log();
  const env = readEnv();
  const keys = Object.keys(env);

  if (keys.length === 0) {
    console.log(`  ${c.dim('No .env file found or empty.')}\n`);
    return;
  }

  section('Environment');

  // Display in a tidy grid
  const rows = [];
  for (const key of keys.sort()) {
    let val = env[key];
    // Mask sensitive values
    if (key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN') || key.includes('PASSWORD')) {
      val = val.length > 8 ? val.slice(0, 4) + '…' + val.slice(-2) : '****';
    }
    // Truncate long values
    if (typeof val === 'string' && val.length > 60) {
      val = val.slice(0, 57) + '…';
    }
    rows.push([key, c.accent(val)]);
  }
  kvGrid(rows);
  console.log(`\n  ${c.dim('Edit:')} ${c.accent('dbh config edit')}`);
  console.log();
}

// ── Set config value ──────────────────────────────────────
async function set(key, value) {
  // Parse value: try JSON, then keep as string
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    parsed = value;
  }

  writeEnv({ [key]: parsed });
  console.log(`\n  ${badge.ok} ${c.accent(key)} ${c.dim('=')} ${c.green(String(value))}`);
  console.log(`  ${c.dim('Restart to apply:')} ${c.accent('dbh restart')}\n`);
}

// ── Edit config in editor ─────────────────────────────────
async function edit() {
  import('node:child_process').then(({ execSync }) => {
    const editor = process.env.EDITOR || process.env.VISUAL || 'nano';
    try {
      execSync(`${editor} .env`, { stdio: 'inherit', cwd: process.cwd() });
      console.log(`\n  ${badge.ok} ${c.green('Saved')}`);
      console.log(`  ${c.dim('Restart to apply:')} ${c.accent('dbh restart')}\n`);
    } catch (err) {
      console.error(`\n  ${c.red('✘')} Editor error: ${err.message}\n`);
    }
  });
}

export default { show, set, edit };
