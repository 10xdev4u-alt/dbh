import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path';
import { getHealth, getModels } from '../lib/http.js';
import { getCurrentHost, getCurrentUrl, getCurrentKey } from '../lib/host.js';
import { c } from '../ui/colors.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8'));

export async function handler({ json } = {}) {
  const info = {
    version: pkg.version,
    name: pkg.name,
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    host: {
      name: getCurrentHost(),
      url: getCurrentUrl(),
      has_key: !!getCurrentKey(),
    },
  };

  try {
    const health = await getHealth();
    info.proxy = { status: 'healthy', ...health };
  } catch {
    info.proxy = { status: 'unreachable' };
  }

  try {
    const models = await getModels();
    info.models = models;
  } catch {
    info.models = [];
  }

  if (json) {
    console.log(JSON.stringify(info, null, 2));
    return;
  }

  console.log(`\n  ${c.bold('dbh')} ${c.dim('v' + info.version)} — ${c.dim(info.name)}`);
  console.log(`  ${c.dim('Node')} ${info.node} ${c.dim('•')} ${info.platform}/${info.arch}`);
  console.log('');
  console.log(`  ${c.bold('Host:')}    ${c.cyan(info.host.url)} ${info.host.name !== 'local' ? c.yellow('('+info.host.name+')') : c.dim('(local)')}`);
  console.log(`  ${c.bold('Proxy:')}   ${info.proxy.status === 'healthy' ? c.green(info.proxy.status) : c.red(info.proxy.status)}`);
  console.log(`  ${c.bold('Models:')}  ${info.proxy.status === 'healthy' ? c.dim(String(info.models.length || 0)+' available') : c.dim('N/A')}`);
  console.log('');
}
