import { c } from '../ui/colors.js';
import { api } from '../lib/http.js';

export async function handler() {
  const res = await api('/api/plugins');

  if (!res.ok) {
    console.error(`  ${c.red('✘')} ${res.error || res.status}`);
    process.exit(1);
  }

  const list = res.data?.plugins || [];
  console.log();
  if (list.length === 0) {
    console.log(`  ${c.dim('No plugins loaded.')}\n`);
    return;
  }
  for (const p of list) {
    console.log(`  ${c.accent('•')} ${c.dim(p.name || p.file || p)}`);
  }
  console.log();
}
