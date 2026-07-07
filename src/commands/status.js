import { c, badge, palette, separator } from '../ui/colors.js';
import { section, statusLine, kvLine, kvGrid } from '../ui/format.js';
import { isRunning, getPort, execInContainer } from '../lib/docker.js';
import { getHealth, getTunnel, getAccounts, getSummary, getPowStatus, getCachedProxyUrl, resetProxyUrl } from '../lib/http.js';
import { readEnv } from '../lib/config.js';

export async function handler() {
  console.log();
  section('DeepBridge Status');

  // ── Container status ──────────────────────────────────
  const running = isRunning();
  statusLine('Container', running ? 'running' : 'stopped', running);

  if (!running) {
    console.log(`\n  ${c.dim('Start it:')} ${c.accent('dbh up')}\n`);
    return;
  }

  const port = getPort();
  statusLine('Port', String(port), true);

  // ── Health check ──────────────────────────────────────
  section('API Health');
  const health = await getHealth();
  if (health.ok) {
    const h = health.data;
    statusLine('Status', h.status || 'ok', h.status === 'ok');
    if (h.accounts) {
      statusLine('Accounts', `${h.accounts.available}/${h.accounts.total}`, h.accounts.available > 0);
      if (h.accounts.banned > 0) statusLine('Banned', String(h.accounts.banned), false);
    }
    if (h.tunnel) {
      statusLine('Tunnel', h.tunnel.ready ? 'connected' : 'waiting…', !!h.tunnel.ready);
    }
  } else {
    statusLine('API', 'unreachable', false);
    if (health.error) console.log(`  ${c.dim('Reason:')} ${c.red(health.error)}`);
  }

  // ── Tunnel ─────────────────────────────────────────────
  section('Tunnel');
  const tunnel = await getTunnel();
  if (tunnel.ok && tunnel.data) {
    const t = tunnel.data;
    statusLine('Status', t.url ? 'connected' : 'waiting…', !!t.url);
    if (t.url) kvLine(c.dim('URL'), c.accent(t.url));
    if (t.customDomain) kvLine(c.dim('Custom'), c.accent(t.customDomain));
    if (t.restartCount > 0) kvLine(c.dim('Restarts'), String(t.restartCount));
    if (t.lastExitCode !== null) kvLine(c.dim('Last exit'), String(t.lastExitCode));
  } else {
    statusLine('Tunnel', 'offline', false);
  }

  // ── Accounts ───────────────────────────────────────────
  section('Accounts');
  const accounts = await getAccounts();
  if (accounts.ok && accounts.data) {
    const list = accounts.data.accounts || [];
    const total = accounts.data.total || list.length;
    const active = list.filter(a => a.status === 'active').length;
    const failed = list.filter(a => a.status === 'failed').length;
    const banned = list.filter(a => a.status === 'banned').length;
    const unknown = list.filter(a => a.status === 'unknown').length;

    statusLine('Total', String(total), total > 0);
    if (active > 0) statusLine('Active', String(active), true);
    if (failed > 0) statusLine('Failed', String(failed), false);
    if (banned > 0) statusLine('Banned', String(banned), false);
    if (unknown > 0) statusLine('Unknown', String(unknown), false);
  } else {
    statusLine('Accounts', 'unreachable', false);
  }

  // ── POW ────────────────────────────────────────────────
  section('POW Cache');
  const pow = await getPowStatus();
  if (pow.ok && pow.data) {
    const list = pow.data.pow || [];
    const fresh = list.filter(p => p.fresh).length;
    statusLine('Pre-warmed', `${fresh}/${list.length}`, fresh === list.length && list.length > 0);
  } else {
    statusLine('POW', 'unreachable', false);
  }

  // ── Summary ────────────────────────────────────────────
  section('Traffic');
  const summary = await getSummary();
  if (summary.ok && summary.data) {
    const s = summary.data;
    kvGrid([
      ['Total requests', c.accent(String(s.totalRequests || 0))],
      ['Success rate', s.successRate >= 0.99 ? c.green(`${(s.successRate * 100).toFixed(1)}%`) : c.yellow(`${(s.successRate * 100).toFixed(1)}%`)],
      ['Avg latency', c.accent(`${s.avgLatency || 0}ms`)],
      ['Total tokens', c.accent(String(s.totalTokens || 0))],
      ['Uptime', c.accent(fmtUptime(Math.floor((s.uptimeMs || 0) / 1000)))],
    ]);
  } else {
    kvLine('Requests', c.dim('no data yet'));
  }

  // ── Quick links ────────────────────────────────────────
  section('Links');
  const base = getCachedProxyUrl();
  kvGrid([
    ['Dashboard', c.accent(`${base}/`)],
    ['Admin', c.accent(`${base}/admin.html`)],
    ['Observability', c.accent(`${base}/observability.html`)],
    ['Health API', c.accent(`${base}/health`)],
    ['Models API', c.accent(`${base}/v1/models`)],
    ['Metrics', c.accent(`${base}/metrics`)],
  ]);
  console.log();
}

function fmtUptime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return (h ? h + 'h ' : '') + (m ? m + 'm ' : '') + sec + 's';
}
