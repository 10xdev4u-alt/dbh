import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { c } from '../ui/colors.js';
import { getCurrentHost, getCurrentUrl, getCurrentKey } from '../lib/host.js';

export async function handler({ format = 'env', output, json } = {}) {
  const host = getCurrentHost();
  const url = getCurrentUrl();
  const key = getCurrentKey();

  // Try to read .env for additional vars
  let envVars = {};
  const envPath = resolve(process.cwd(), '.env');
  if (existsSync(envPath)) {
    const text = readFileSync(envPath, 'utf8');
    for (const line of text.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 1) continue;
      envVars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
    }
  }

  if (json) {
    console.log(JSON.stringify({ host, url, key: key || null, env: envVars }, null, 2));
    return;
  }

  if (format === 'env') {
    const lines = [
      `# dbh export — active host: ${host}`,
      `PROXY_URL=${url}`,
      key ? `API_KEY=${key}` : '',
      ...Object.entries(envVars).map(([k, v]) => `${k}=${v}`),
    ].filter(Boolean);
    const out = lines.join('\n') + '\n';
    if (output) {
      const { writeFileSync } = await import('node:fs');
      writeFileSync(output, out, 'utf8');
      console.log(c.green(`✓ Exported to ${output}`));
    } else {
      console.log(out);
    }
  } else {
    console.log(`  ${c.bold('Active host:')} ${c.cyan(host)}`);
    console.log(`  ${c.bold('Proxy URL:')}  ${c.cyan(url)}`);
    if (key) console.log(`  ${c.bold('API Key:')}    ${c.dim(key.slice(0, 8)+'…')}`);
    console.log(`  ${c.bold('Format:')}     ${c.dim(format)}`);
  }
}
