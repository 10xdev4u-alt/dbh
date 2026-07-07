import { c } from '../ui/colors.js';
import { readEnv, findProxyDir } from './config.js';

// ── Detect proxy URL ─────────────────────────────────────
export function getProxyUrl() {
  // Priority: env > docker > localhost
  const env = readEnv(findProxyDir() || process.cwd());
  if (env.PROXY_URL) return env.PROXY_URL.replace(/\/+$/, '');

  // Check if Docker is running and get port
  try {
    const { execSync } = await import('node:child_process');
    const out = execSync('docker port deepbridge 3002/tcp 2>/dev/null || echo ""', { stdio: 'pipe', timeout: 5000, encoding: 'utf8' });
    const match = out.trim().match(/0\.0\.0\.0:(\d+)/);
    if (match) return `http://localhost:${match[1]}`;
  } catch {}

  return 'http://localhost:3002';
}

// Lazy cache for proxy URL
let _proxyUrl = null;
export function getCachedProxyUrl() {
  if (!_proxyUrl) _proxyUrl = getProxyUrl();
  return _proxyUrl;
}

export function resetProxyUrl() {
  _proxyUrl = null;
}

// ── HTTP helpers ──────────────────────────────────────────
export async function api(path, options = {}) {
  const base = options.baseUrl || getCachedProxyUrl();
  const url = `${base}${path}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 10000);

  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    let data;
    const text = await res.text();
    try { data = JSON.parse(text); } catch { data = text; }

    return {
      ok: res.ok,
      status: res.status,
      data,
      text,
    };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      return { ok: false, status: 0, data: null, text: '', error: 'timeout' };
    }
    if (err.cause?.code === 'ECONNREFUSED') {
      return { ok: false, status: 0, data: null, text: '', error: 'connection_refused' };
    }
    return { ok: false, status: 0, data: null, text: '', error: err.message };
  }
}

// ── Specific API calls ────────────────────────────────────
export async function getHealth(baseUrl) {
  return api('/health', { baseUrl });
}

export async function getModels(baseUrl, apiKey) {
  const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
  return api('/v1/models', { baseUrl, headers });
}

export async function getTunnel(baseUrl) {
  return api('/api/tunnel', { baseUrl });
}

export async function getAccounts(baseUrl, apiKey) {
  const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
  return api('/api/accounts', { baseUrl, headers });
}

export async function getStats(baseUrl) {
  return api('/api/stats', { baseUrl });
}

export async function getSummary(baseUrl) {
  return api('/api/observability/summary', { baseUrl });
}

export async function getPowStatus(baseUrl) {
  return api('/api/pow', { baseUrl });
}

// ── Chat test ─────────────────────────────────────────────
export async function testChat(baseUrl, apiKey, model = 'default') {
  const headers = {
    'Content-Type': 'application/json',
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  };
  return api('/v1/chat/completions', {
    baseUrl,
    method: 'POST',
    headers,
    body: {
      model,
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 10,
    },
    timeout: 30000,
  });
}
