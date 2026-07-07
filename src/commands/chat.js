import { c, badge } from '../ui/colors.js';
import { api } from '../lib/http.js';
import { readEnv, parseApiKeys } from '../lib/config.js';

function getKey() {
  const env = readEnv();
  return parseApiKeys(env.API_KEYS)[0] || null;
}

export async function handler(prompt, model = 'default') {
  if (!prompt) {
    console.error(`  ${c.red('✘')} Usage: dbh chat <prompt> [--model <name>]`);
    process.exit(1);
  }

  const key = getKey();
  const headers = {
    'Content-Type': 'application/json',
    ...(key ? { Authorization: `Bearer ${key}` } : {}),
  };

  const res = await api('/v1/chat/completions', {
    method: 'POST',
    headers,
    body: { model, messages: [{ role: 'user', content: prompt }], max_tokens: 1024 },
    timeout: 30000,
  });

  if (!res.ok) {
    console.error(`\n  ${c.red('✘')} ${res.data?.error?.message || res.error || res.status}\n`);
    process.exit(1);
  }

  const msg = res.data?.choices?.[0]?.message;
  const text = msg?.content?.trim() || '(empty)';
  console.log(`\n  ${c.dim(text)}\n`);
}
