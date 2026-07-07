import { c } from '../ui/colors.js';
import { section, statusLine, kvGrid } from '../ui/format.js';
import { api } from '../lib/http.js';

export async function handler() {
  const res = await api('/api/usage');

  if (!res.ok) {
    console.error(`  ${c.red('✘')} ${res.error || res.status}`);
    process.exit(1);
  }

  const data = res.data;
  console.log();

  if (data.byModel) {
    section('By Model');
    for (const m of data.byModel) {
      statusLine(m.model, `${m.total} req · ${m.ok} ok · ${m.err} err · ${m.avgLatency}ms`, m.err === 0);
    }
  }

  if (data.byDay) {
    section('Last 7 Days');
    for (const d of data.byDay) {
      const hasTraffic = d.total > 0;
      statusLine(d.date, hasTraffic ? `${d.total} req · ${d.tokens} tok` : 'no data', hasTraffic);
    }
  }

  console.log();
}
