import { c } from '../ui/colors.js';
import { createTable } from '../ui/format.js';
import { api } from '../lib/http.js';
import { readEnv, parseApiKeys } from '../lib/config.js';

function getKey() {
  const env = readEnv();
  return parseApiKeys(env.API_KEYS)[0] || null;
}

export async function handler() {
  const key = getKey();
  const headers = key ? { Authorization: `Bearer ${key}` } : {};
  const res = await api('/v1/models', { headers });

  if (!res.ok) {
    console.error(`  ${c.red('✘')} ${res.error || res.status}`);
    process.exit(1);
  }

  const list = res.data?.data || [];
  console.log();
  const table = createTable(['Model', 'Type', 'Features']);
  for (const m of list) {
    const id = m.id || 'unknown';
    const suffix = id.includes('-thinking') ? 'thinking' : id.includes('-search') ? 'search' : 'base';
    const features = m.thinking && m.search ? 'think+search' : m.thinking ? 'thinking' : m.search ? 'search' : '—';
    table.push([c.accent(id), suffix, features]);
  }
  console.log(table.toString());
  console.log();
}
