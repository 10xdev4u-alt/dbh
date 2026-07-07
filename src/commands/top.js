import { getUsage, getMetrics, getStats, getSummary } from '../lib/http.js';
import { c } from '../ui/colors.js';

export async function handler({ json } = {}) {
  const [usage, metrics, stats, summary] = await Promise.all([
    getUsage().catch(() => null),
    getMetrics().catch(() => null),
    getStats().catch(() => null),
    getSummary().catch(() => null),
  ]);

  if (json) {
    console.log(JSON.stringify({ usage: usage?.data, metrics: metrics?.data, stats: stats?.data, summary: summary?.data }, null, 2));
    return;
  }

  console.log(`\n  ${c.bold('Proxy Top')} ${c.dim('— live metrics')}`);

  if (summary?.ok && summary?.data) {
    const s = summary.data;
    console.log(`  ${c.bold('Active sessions:')} ${c.cyan(String(s.active_sessions ?? '?'))}`);
    console.log(`  ${c.bold('Rate limit:')}      ${c.cyan(String(s.rpm ?? '?') + ' rpm')}  /  ${c.cyan(String(s.tpm ?? '?') + ' tpm')}`);
    console.log(`  ${c.bold('Avg latency:')}     ${c.cyan(String(s.avg_latency_ms ?? '?') + ' ms')}`);
  }

  if (stats?.ok && stats?.data?.accounts) {
    console.log(`  ${c.bold('Accounts:')}       ${c.cyan(String(stats.data.accounts.total ?? '?'))} total, ${c.green(String(stats.data.accounts.active ?? '?'))} active`);
  }
  if (usage?.ok && usage?.data) {
    console.log(`  ${c.bold('7-day usage:')}    ${c.cyan(String(usage.data.total_requests ?? '?'))} requests`);
  }
  if (metrics?.ok && metrics?.data?.prometheus) {
    const lines = String(metrics.data.prometheus).split('\n').filter(l => l && !l.startsWith('#')).slice(-5);
    if (lines.length) {
      console.log(`  ${c.bold('Latest metrics:')}`);
      for (const l of lines) console.log(`    ${c.dim(l)}`);
    }
  }
  console.log('');
}
