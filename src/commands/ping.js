import { getHealth } from '../lib/http.js';
import { c } from '../ui/colors.js';

export async function handler({ json } = {}) {
  const start = Date.now();
  try {
    const health = await getHealth();
    const ms = Date.now() - start;
    if (json) {
      console.log(JSON.stringify({ status: 'ok', latency_ms: ms, ...health }, null, 2));
      return;
    }
    console.log(`${c.green('✓')} Proxy is ${c.bold('healthy')} — ${c.dim(`${ms}ms`)}`);
    if (health.message) console.log(`  ${c.dim(health.message)}`);
  } catch (err) {
    if (json) {
      console.log(JSON.stringify({ status: 'error', error: err.message }, null, 2));
      return;
    }
    console.log(`${c.red('✗')} ${c.bold('Unreachable')} — ${c.dim(err.message)}`);
    process.exit(1);
  }
}
