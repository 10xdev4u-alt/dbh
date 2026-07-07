import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, createReadStream, readdirSync, statSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { homedir } from 'node:os';
import { c } from '../ui/colors.js';
import { findProxyDir } from './config.js';

// ── Paths ─────────────────────────────────────────────────
const DBH_BACKUP_DIR = resolve(homedir(), '.dbh', 'backups');

function ensureBackupDir() {
  if (!existsSync(DBH_BACKUP_DIR)) {
    mkdirSync(DBH_BACKUP_DIR, { recursive: true });
  }
}

// ── Backup ────────────────────────────────────────────────
export async function backup(proxyDir) {
  ensureBackupDir();
  const dir = proxyDir || findProxyDir() || process.cwd();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archiveName = `deepbridge-backup-${timestamp}.tar.gz`;
  const archivePath = resolve(DBH_BACKUP_DIR, archiveName);

  // Files to include
  const files = [
    '.env',
    '.auth-cache.json',
    'data/accounts.json',
    'data/keys.json',
    'data/remember.json',
    'data/webhook-state.json',
    'docker-compose.yml',
    'docker-compose.public.yml',
  ];

  // Filter to existing files
  const existing = files.filter(f => existsSync(resolve(dir, f)));

  if (existing.length === 0) {
    return { success: false, reason: 'no backup files found', path: null };
  }

  // Create tar
  try {
    execSync(
      `tar -czf "${archivePath}" ${existing.map(f => `"${f}"`).join(' ')}`,
      { cwd: dir, stdio: 'pipe', timeout: 30000 }
    );
    return { success: true, path: archivePath, files: existing.length };
  } catch (err) {
    return { success: false, reason: err.message, path: null };
  }
}

// ── List backups ──────────────────────────────────────────
export function listBackups() {
  ensureBackupDir();
  try {
    const entries = readdirSync(DBH_BACKUP_DIR)
      .filter(f => f.endsWith('.tar.gz'))
      .map(f => {
        const stat = statSync(resolve(DBH_BACKUP_DIR, f));
        return { name: f, size: stat.size, date: stat.mtime };
      })
      .sort((a, b) => b.date - a.date);
    return entries;
  } catch {
    return [];
  }
}

// ── Restore latest backup ─────────────────────────────────
export async function restore(proxyDir, backupFile = null) {
  const dir = proxyDir || findProxyDir() || process.cwd();

  // Find backup
  let archivePath;
  if (backupFile) {
    archivePath = resolve(backupFile);
    if (!existsSync(archivePath)) {
      return { success: false, reason: `backup not found: ${backupFile}` };
    }
  } else {
    const backups = listBackups();
    if (backups.length === 0) {
      return { success: false, reason: 'no backups available' };
    }
    archivePath = resolve(DBH_BACKUP_DIR, backups[0].name);
  }

  // Restore
  try {
    execSync(`tar -xzf "${archivePath}" -C "${dir}"`, { stdio: 'pipe', timeout: 30000 });
    return { success: true, path: archivePath };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

// ── Get backup directory ──────────────────────────────────
export function getBackupDir() {
  ensureBackupDir();
  return DBH_BACKUP_DIR;
}
