import { c, badge } from '../ui/colors.js';
import { api } from '../lib/http.js';

export async function list() {
  const res = await api('/api/webhooks');
  if (!res.ok) {
    console.log(`  ${c.red('✘')} ${res.error || res.status}`);
    return;
  }
  const deliveries = res.data?.deliveries || [];
  console.log();
  if (deliveries.length === 0) {
    console.log(`  ${c.dim('No webhook deliveries yet.')}\n`);
    return;
  }
  for (const d of deliveries.slice(0, 20)) {
    const icon = d.status === 'ok' ? c.green('●') : c.red('○');
    const kind = d.kind?.padEnd(16) || '';
    const ts = new Date(d.ts).toLocaleTimeString();
    console.log(`  ${icon} ${c.dim(ts)} ${c.accent(kind)} ${d.status}${d.code ? ' ' + d.code : ''}`);
  }
  console.log();
}

export async function test() {
  const res = await api('/api/webhooks/test', { method: 'POST' });
  if (res.ok && res.data?.ok) {
    console.log(`  ${badge.ok} ${c.green('Test webhook sent')}`);
  } else {
    console.log(`  ${c.yellow('⚠')} ${res.data?.error || res.status || 'failed'}`);
  }
  console.log();
}

export default { list, test };
