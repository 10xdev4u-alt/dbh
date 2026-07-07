import { execSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { c } from '../ui/colors.js';
import { findProxyDir } from './config.js';

// ── Helpers ───────────────────────────────────────────────
function run(cmd, opts = {}) {
  const defaultOpts = { stdio: opts.json ? 'pipe' : 'inherit', timeout: 120000 };
  try {
    const out = execSync(cmd, { ...defaultOpts, ...opts, encoding: 'utf8' });
    return opts.json ? JSON.parse(out.trim()) : out?.toString()?.trim() || '';
  } catch (err) {
    if (opts.json && err.stdout) {
      try { return JSON.parse(err.stdout.toString().trim()); } catch {}
    }
    throw err;
  }
}

function composeFile(dir) {
  const publicFile = resolve(dir, 'docker-compose.public.yml');
  const defaultFile = resolve(dir, 'docker-compose.yml');
  if (existsSync(publicFile)) return publicFile;
  if (existsSync(defaultFile)) return defaultFile;
  return null;
}

function composeCmd(dir) {
  const cf = composeFile(dir);
  if (!cf) return 'docker compose';
  const relative = resolve(dir) === resolve('.') ? '-f docker-compose.yml' : `-f "${cf}"`;
  return `docker compose ${relative}`;
}

// ── Public API ────────────────────────────────────────────

export function getProjectDir() {
  return findProxyDir() || process.cwd();
}

export function isRunning() {
  try {
    const out = execSync('docker ps --filter name=deepbridge --format "{{.Names}}"', { stdio: 'pipe', timeout: 5000, encoding: 'utf8' });
    return out.trim().includes('deepbridge');
  } catch {
    return false;
  }
}

export function getContainerId() {
  try {
    return execSync('docker ps --filter name=deepbridge --format "{{.ID}}"', { stdio: 'pipe', timeout: 5000, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

export function up({ detach = true, build = false } = {}) {
  const dir = getProjectDir();
  const cmd = `${composeCmd(dir)} up${detach ? ' -d' : ''}${build ? ' --build' : ''}`;
  run(cmd, { cwd: dir });
  return { success: true, dir };
}

export function down() {
  const dir = getProjectDir();
  const cmd = `${composeCmd(dir)} down`;
  run(cmd, { cwd: dir });
  return { success: true, dir };
}

export function restart() {
  const id = getContainerId();
  if (id) {
    run(`docker restart ${id}`);
    return { success: true, method: 'restart' };
  }
  // Fall back to compose restart
  const dir = getProjectDir();
  run(`${composeCmd(dir)} restart`, { cwd: dir });
  return { success: true, method: 'compose' };
}

export function logs({ follow = false, lines = 50 } = {}) {
  const id = getContainerId();
  if (!id) throw new Error('Container not running');
  const flags = follow ? '-f' : '';
  // Spawn logs as a child process (inherits stdin so Ctrl+C works)
  const child = spawn('docker', ['logs', ...(follow ? ['-f'] : []), '--tail', String(lines), id], {
    stdio: 'inherit',
  });
  return child;
}

export function ps() {
  const dir = getProjectDir();
  const cmd = `${composeCmd(dir)} ps --format json`;
  try {
    const out = execSync(cmd, { cwd: dir, stdio: 'pipe', timeout: 10000, encoding: 'utf8' });
    return out.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  } catch {
    return [];
  }
}

export function pull() {
  const dir = getProjectDir();
  run(`${composeCmd(dir)} pull`, { cwd: dir });
  return { success: true };
}

export function inspect() {
  try {
    const out = execSync('docker inspect deepbridge', { stdio: 'pipe', timeout: 5000, encoding: 'utf8' });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

export function execInContainer(args) {
  const id = getContainerId();
  if (!id) throw new Error('Container not running');
  const cmd = `docker exec ${id} ${args.join(' ')}`;
  return execSync(cmd, { stdio: 'pipe', timeout: 15000, encoding: 'utf8' }).trim();
}

export function getPort() {
  try {
    const out = execSync('docker port deepbridge 3002/tcp', { stdio: 'pipe', timeout: 5000, encoding: 'utf8' });
    const match = out.trim().match(/0\.0\.0\.0:(\d+)/);
    return match ? parseInt(match[1], 10) : 3002;
  } catch {
    return 3002;
  }
}
