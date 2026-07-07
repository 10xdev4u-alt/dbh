import { c, badge } from '../ui/colors.js';
import { section, statusLine } from '../ui/format.js';
import { api } from '../lib/http.js';

export async function status() {
  const res = await api('/api/tunnel');
  if (!res.ok) {
    console.log(`  ${c.red('✘')} ${res.error || res.status}`);
    return;
  }
  const t = res.data;
  console.log();
  section('Tunnel');
  statusLine('Status', t.url ? 'connected' : 'waiting…', !!t.url);
  if (t.url) console.log(`  ${c.dim('URL:')}    ${c.accent(t.url)}`);
  if (t.customDomain) console.log(`  ${c.dim('Domain:')} ${c.accent(t.customDomain)}`);
  statusLine('Running', t.running ? 'yes' : 'no', !!t.running);
  if (t.restartCount > 0) statusLine('Restarts', String(t.restartCount), false);
  if (t.lastExitCode !== null) statusLine('Exit code', String(t.lastExitCode), t.lastExitCode === 0);
  console.log();
}

export async function rotate() {
  const res = await api('/api/tunnel/rotate', { method: 'POST' });
  if (res.ok) {
    console.log(`  ${badge.ok} ${c.green('Tunnel rotated')}`);
    if (res.data?.url) console.log(`  ${c.dim('New URL:')} ${c.accent(res.data.url)}`);
  } else {
    console.log(`  ${c.red('✘')} ${res.error || res.status}`);
  }
  console.log();
}

export async function restart() {
  const res = await api('/api/tunnel/restart', { method: 'POST' });
  console.log(`  ${res.ok ? badge.ok : c.red('✘')} ${res.ok ? c.green('Tunnel restarting') : c.red(res.error || res.status)}`);
  console.log();
}

export default { status, rotate, restart };
