import { c } from '../ui/colors.js';
import { api } from '../lib/http.js';

export async function handler() {
  const res = await api('/metrics', { timeout: 15000 });

  if (!res.ok) {
    console.error(`  ${c.red('✘')} ${res.error || res.status}`);
    process.exit(1);
  }

  const lines = (res.text || '').split('\n');
  const filtered = lines.filter(l => l && !l.startsWith('# '));
  console.log();
  for (const line of filtered.slice(0, 30)) {
    console.log(`  ${c.dim(line)}`);
  }
  if (filtered.length > 30) {
    console.log(`  ${c.dim('…')}  ${c.muted(`${filtered.length - 30} more lines`)}`);
  }
  console.log();
}
