import { c } from '../ui/colors.js';
import { readEnv, findProxyDir } from './config.js';
import { getCurrentUrl, getCurrentKey } from './host.js';

// Inline parseApiKeys to avoid cross-ESM require issues
function parseKeys(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(k => String(k).trim()).filter(Boolean);
  } catch {}
  return raw.split(',').map(k => k.trim()).filter(Boolean);
}

// ── Detect proxy URL ─────────────────────────────────────
export function getProxyUrl() {
  try {
    const hostUrl = getCurrentUrl();
    if (hostUrl) return hostUrl;
  } catch {}

  const env = readEnv(findProxyDir() || process.cwd());
  if (env.PROXY_URL) return env.PROXY_URL.replace(/\/+$/, '');

  try {
    const { execSync } = require('child_process');
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

export function getApiKey() {
  try {
    const key = getCurrentKey();
    if (key) return key;
  } catch {}
  try {
    const env = readEnv();
    const keys = parseKeys(env.API_KEYS);
    return keys[0] || null;
  } catch { return null; }
}

export function resetProxyUrl() {
  _proxyUrl = getProxyUrl();
}

// ── HTTP helpers ──────────────────────────────────────────
export async function api(path, options = {}) {
  const base = options.baseUrl || getCachedProxyUrl();
  const url = `${base}${path}`;
  const apiKey = options.apiKey || getApiKey();
  const headers = { 'Content-Type': 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}), ...options.headers };
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

    return { ok: res.ok, status: res.status, data, text, error: null };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') return { ok: false, status: 0, data: null, text: '', error: 'timeout' };
    if (err.cause?.code === 'ECONNREFUSED') return { ok: false, status: 0, data: null, text: '', error: 'connection_refused' };
    return { ok: false, status: 0, data: null, text: '', error: err.message };
  }
}

// ── Specific API calls ────────────────────────────────────
export async function getHealth(baseUrl) { return api('/health', { baseUrl }); }
export async function getModels(baseUrl, apiKey) { return api('/v1/models', { baseUrl, apiKey }); }
export async function getTunnel(baseUrl) { return api('/api/tunnel', { baseUrl }); }
export async function getAccounts(baseUrl) { return api('/api/accounts', { baseUrl }); }
export async function getStats(baseUrl) { return api('/api/stats', { baseUrl }); }
export async function getSummary(baseUrl) { return api('/api/observability/summary', { baseUrl }); }
export async function getPowStatus(baseUrl) { return api('/api/pow', { baseUrl }); }
export async function getWebhooks(baseUrl) { return api('/api/webhooks', { baseUrl }); }
export async function getUsage(baseUrl) { return api('/api/usage', { baseUrl }); }
export async function getMetrics(baseUrl) { return api('/metrics', { baseUrl, timeout: 15000 }); }
export async function getPlugins(baseUrl) { return api('/api/plugins', { baseUrl }); }

export async function testChat(baseUrl, prompt = 'hi', model = 'default') {
  return api('/v1/chat/completions', {
    baseUrl, method: 'POST',
    body: { model, messages: [{ role: 'user', content: prompt }], max_tokens: 50 },
    timeout: 30000,
  });
}
