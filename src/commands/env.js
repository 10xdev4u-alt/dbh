import { readEnv, findProxyDir } from '../lib/config.js';
import { c } from '../ui/colors.js';

export async function handler({ json } = {}) {
  const dir = findProxyDir() || process.cwd();
  const env = readEnv(dir);
  const keys = Object.keys(env).sort();

  if (json) {
    console.log(JSON.stringify({ directory: dir, variables: env }, null, 2));
    return;
  }

  console.log(`\n  ${c.bold('Proxy directory:')} ${c.dim(dir)}`);
  console.log(`  ${c.bold('Variables:')}      ${c.dim(String(keys.length) + ' set')}`);
  console.log('');
  if (keys.length === 0) {
    console.log(`  ${c.yellow('No environment variables found.')}`);
    console.log('');
    return;
  }
  for (const k of keys) {
    const val = env[k];
    const display = val.length > 40 ? val.slice(0, 20) + '…' + val.slice(-20) : val;
    if (k.toLowerCase().includes('key') || k.toLowerCase().includes('secret') || k.toLowerCase().includes('password') || k.toLowerCase().includes('token') || k.toLowerCase().includes('auth')) {
      console.log(`  ${c.bold(k)} = ${c.dim(display.slice(0, 4) + '…' + display.slice(-4))}`);
    } else {
      console.log(`  ${c.bold(k)} = ${c.cyan(display)}`);
    }
  }
  console.log('');
}
