import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir, hostname } from 'node:os';
import Conf from 'conf';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Project-level config (from .env or data/)
const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();

// User-level config (~/.dbh/)
const DBH_DIR = resolve(homedir(), '.dbh');
if (!existsSync(DBH_DIR)) {
  mkdirSync(DBH_DIR, { recursive: true });
}

// State cache (last known container status, tunnel URL, etc.)
let _state = null;
function state() {
  if (!_state) {
    _state = new Conf({
      projectName: 'dbh',
      cwd: DBH_DIR,
      defaults: {
        lastTunnelUrl: null,
        containerRunning: false,
        lastChecked: null,
        proxyDir: process.cwd(),
      },
    });
  }
  return _state;
}

// ── Load .env from project directory ──────────────────────
export function loadDotEnv(dir = PROJECT_ROOT) {
  const envPath = resolve(dir, '.env');
  const env = {};
  if (existsSync(envPath)) {
    const text = readFileSync(envPath, 'utf8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        env[key] = val.slice(1, -1);
      } else {
        env[key] = val;
      }
    }
  }
  return env;
}

// ── Read/write .env file ──────────────────────────────────
export function readEnv(dir = PROJECT_ROOT) {
  return loadDotEnv(dir);
}

export function writeEnv(entries, dir = PROJECT_ROOT) {
  const envPath = resolve(dir, '.env');
  const existing = readEnv(dir);
  const merged = { ...existing, ...entries };
  const lines = Object.entries(merged).map(([k, v]) => {
    // JSON-stringify arrays and objects
    if (typeof v === 'object' && v !== null) {
      return `${k}=${JSON.stringify(v)}`;
    }
    if (typeof v === 'string' && (v.includes(' ') || v.includes('#') || v.includes('='))) {
      return `${k}="${v}"`;
    }
    return `${k}=${v}`;
  });
  writeFileSync(envPath, lines.join('\n') + '\n', 'utf8');
}

// ── Parse DEEPSEEK_ACCOUNTS ────────────────────────────────
export function parseAccounts(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (_) {}
  // fallback: user|pass format
  return raw.split(/[,\n]/).map(s => s.trim()).filter(Boolean).map(s => {
    const [email, password] = s.split('|');
    return { email: email?.trim(), password: password?.trim() || '' };
  });
}

// ── Parse API_KEYS ─────────────────────────────────────────
export function parseApiKeys(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(k => String(k).trim()).filter(Boolean);
  } catch (_) {}
  return raw.split(',').map(k => k.trim()).filter(Boolean);
}

// ── State helpers ─────────────────────────────────────────
export function getState() {
  return state().store;
}

export function setState(key, value) {
  state().set(key, value);
}

export function getProxyDir() {
  return state().get('proxyDir') || process.cwd();
}

export function setProxyDir(dir) {
  state().set('proxyDir', dir);
}

// ── Detect proxy directory ────────────────────────────────
export function findProxyDir(start = process.cwd(), depth = 0) {
  if (depth > 10) return null;
  // Check if current dir has docker-compose.yml
  const candidates = [
    resolve(start, 'docker-compose.yml'),
    resolve(start, 'docker-compose.public.yml'),
    resolve(start, 'Dockerfile'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return start;
  }
  // Check parent
  const parent = resolve(start, '..');
  if (parent !== start) return findProxyDir(parent, depth + 1);
  return null;
}

// ── Check if Docker is available ──────────────────────────
export async function checkDocker() {
  try {
    const { execSync } = await import('node:child_process');
    execSync('docker info --format "{{.ServerVersion}}"', { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function checkDockerCompose() {
  try {
    const { execSync } = await import('node:child_process');
    execSync('docker compose version', { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    try {
      const { execSync } = await import('node:child_process');
      execSync('docker-compose --version', { stdio: 'pipe', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
