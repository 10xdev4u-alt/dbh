import { c, badge, palette, separator } from '../ui/colors.js';
import { section, statusLine, kvLine } from '../ui/format.js';
import { checkDocker, checkDockerCompose, findProxyDir, readEnv, parseApiKeys, parseAccounts } from '../lib/config.js';
import { isRunning } from '../lib/docker.js';
import { getHealth, getCachedProxyUrl } from '../lib/http.js';

export async function handler() {
  console.log();
  separator('DeepBridge Diagnostics');

  let allOk = true;

  // ── 1. Docker ──────────────────────────────────────────
  section('1. Docker');
  const hasDocker = await checkDocker();
  statusLine('Docker', hasDocker ? 'available' : 'not found', hasDocker);
  if (!hasDocker) allOk = false;

  const hasCompose = await checkDockerCompose();
  statusLine('Docker Compose', hasCompose ? 'available' : 'not found', hasCompose);
  if (!hasCompose) allOk = false;

  // ── 2. Project ─────────────────────────────────────────
  section('2. Project');
  const dir = findProxyDir();
  statusLine('Project dir', dir || 'not found', !!dir);
  if (!dir) allOk = false;

  // ── 3. Container ───────────────────────────────────────
  section('3. Container');
  const running = isRunning();
  statusLine('Status', running ? 'running' : 'stopped', running);
  if (running) {
    const health = await getHealth();
    if (health.ok) {
      const h = health.data;
      statusLine('API health', h.status || 'ok', h.status === 'ok');
      if (h.tunnel) statusLine('Tunnel', h.tunnel.ready ? 'connected' : 'waiting…', !!h.tunnel.ready);
    } else {
      statusLine('API', 'unreachable', false);
      allOk = false;
    }
  }

  // ── 4. Configuration ───────────────────────────────────
  section('4. Configuration');
  const env = readEnv(dir);
  const accounts = parseAccounts(env.DEEPSEEK_ACCOUNTS);
  statusLine('Accounts', `${accounts.length} configured`, accounts.length > 0);
  if (accounts.length === 0) allOk = false;

  const keys = parseApiKeys(env.API_KEYS);
  statusLine('API Keys', keys.length > 0 ? `${keys.length} configured` : 'none (open)', true);

  const discordToken = env.DISCORD_BOT_TOKEN;
  statusLine('Discord Bot', discordToken ? 'configured' : 'not configured', true);

  const logLevel = env.LOG_LEVEL || 'INFO';
  statusLine('Log Level', logLevel, true);

  const port = env.PORT || '3002';
  statusLine('Port', port, true);

  console.log();

  // ── Summary ────────────────────────────────────────────
  if (allOk) {
    console.log(`  ${c.green('✔ All checks passed.')} DeepBridge is healthy.\n`);
  } else {
    console.log(`  ${c.yellow('⚠ Some checks failed.')} Review the issues above.\n`);
  }
}
