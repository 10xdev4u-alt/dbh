import { c, badge, palette, separator } from '../ui/colors.js';
import { section, statusLine, kvLine, startSpinner, succeedSpinner, failSpinner } from '../ui/format.js';
import { backup as doBackup, listBackups, getBackupDir } from '../lib/backup.js';
import { findProxyDir } from '../lib/config.js';

export async function handler() {
  console.log();
  separator('Backup DeepBridge');

  const dir = findProxyDir();
  if (!dir) {
    console.log(`  ${c.yellow('⚠')} No DeepBridge project found. Run from the project directory.\n`);
    process.exit(1);
  }

  startSpinner('Creating backup archive…');
  const result = await doBackup(dir);
  succeedSpinner();

  if (result.success) {
    const size = (await import('node:fs')).statSync(result.path).size;
    const sizeStr = size > 1024 * 1024
      ? `${(size / 1024 / 1024).toFixed(1)} MB`
      : `${(size / 1024).toFixed(1)} KB`;

    console.log();
    section('Backup Created');
    kvLine('File', c.accent(result.path));
    kvLine('Size', c.accent(sizeStr));
    kvLine('Files', c.accent(String(result.files)));
    console.log();
    console.log(`  ${c.dim('Restore:')} ${c.accent('dbh backup show')}`);
    console.log();
  } else {
    failSpinner('Backup failed');
    console.log(`  ${c.red(result.reason || 'unknown error')}\n`);
    process.exit(1);
  }
}

// ── List backups ──────────────────────────────────────────
export async function list() {
  console.log();
  section('Available Backups');

  const backups = listBackups();
  if (backups.length === 0) {
    console.log(`  ${c.dim('No backups found.')}`);
    console.log(`  ${c.dim('Create one:')} ${c.accent('dbh backup')}\n`);
    return;
  }

  for (const b of backups) {
    const size = b.size > 1024 * 1024
      ? `${(b.size / 1024 / 1024).toFixed(1)} MB`
      : `${(b.size / 1024).toFixed(1)} KB`;
    console.log(`  ${c.dim('•')} ${c.accent(b.name)} ${c.dim(`(${size}, ${b.date.toLocaleString()})`)}`);
  }
  console.log(`\n  ${c.dim('Directory:')} ${c.accent(getBackupDir())}`);
  console.log();
}
