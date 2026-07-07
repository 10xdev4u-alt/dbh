import { createInterface } from 'node:readline';
import { c, palette, badge, separator } from '../ui/colors.js';
import { section, statusLine, kvLine, kvGrid } from '../ui/format.js';
import { isRunning } from '../lib/docker.js';
import { getCurrentHost, getCurrentUrl } from '../lib/host.js';
import { getHealth, getTunnel, getAccounts, getSummary, getModels, getUsage, getWebhooks, getPowStatus, getPlugins, getCachedProxyUrl } from '../lib/http.js';

const STATE = { running: false, history: [], autoRefresh: null, tunnelUrl: null, isRemote: false };

function isRemoteHost() {
  try { return getCurrentHost() !== 'local'; } catch { return false; }
}

const BANNER = `
  ${c.accent('⌬')} ${c.bold('dbh')} ${c.dim('— DeepBridge Harness')}
  ${c.dim('Type')} ${c.accent('.help')} ${c.dim('for commands or press Tab to autocomplete.')}
  ${c.dim('Try:')} ${c.accent('status')} ${c.dim('·')} ${c.accent('models')} ${c.dim('·')} ${c.accent('.host')}
`;

const HELP_TEXT = `
  ${c.bold('Status & Info')}
  ${c.accent('status')}      Show full proxy status
  ${c.accent('health')}      Quick health check
  ${c.accent('url')}         Get tunnel URL
  ${c.accent('models')}      List available models
  ${c.accent('usage')}       7-day usage stats
  ${c.accent('plugins')}     List loaded plugins

  ${c.bold('Proxy Control')}
  ${c.accent('up')}          Start proxy (local only)
  ${c.accent('down')}        Stop proxy (local only)
  ${c.accent('restart')}     Restart proxy (local only)
  ${c.accent('logs')}        View logs (local only)

  ${c.bold('Remote Hosts')}
  ${c.accent('.host')}       Show active host
  ${c.accent('accounts')}    List DeepSeek accounts
  ${c.accent('keys')}        List API keys
  ${c.accent('account add')} Add an account
  ${c.accent('key add')}     Add an API key

  ${c.bold('Dot Commands')}
  ${c.accent('.help')}       Show this help
  ${c.accent('.clear')}      Clear screen
  ${c.accent('.exit')}       Exit REPL
  ${c.accent('.watch')}      Toggle auto-refresh
  ${c.accent('.theme')}      Show theme colors
  ${c.accent('.host')}       Show active host
`;

async function cmdStatus() {
  console.log();
  const remote = isRemoteHost();
  STATE.isRemote = remote;

  section('Status');
  if (remote) {
    const url = getCachedProxyUrl();
    statusLine('Host', `${getCurrentHost()} ${c.dim('(' + url + ')')}`, true);
    statusLine('Type', 'remote', true);
  } else {
    const running = isRunning();
    statusLine('Container', running ? 'running' : 'stopped', running);
    STATE.running = running;
  }

  const health = await getHealth();
  if (health.ok) {
    const h = health.data;
    statusLine('API', h.status || 'ok', h.status === 'ok');
    if (h.accounts) statusLine('Accounts', `${h.accounts.available}/${h.accounts.total}`, h.accounts.available > 0);
    if (h.tunnel) statusLine('Tunnel', h.tunnel.ready ? 'connected' : 'waiting…', !!h.tunnel.ready);
  } else if (!remote) {
    console.log(`  ${c.dim('Start it:')} ${c.accent('dbh up')}`);
  } else {
    statusLine('API', 'unreachable', false);
  }

  const summary = await getSummary();
  if (summary.ok && summary.data) {
    const s = summary.data;
    console.log(`  ${c.dim('Requests:')} ${c.accent(String(s.totalRequests || 0))} ${c.dim('· Latency:')} ${c.accent(`${s.avgLatency || 0}ms`)} ${c.dim('· Success:')} ${s.successRate >= 0.99 ? c.green(`${(s.successRate * 100).toFixed(1)}%`) : c.yellow(`${(s.successRate * 100).toFixed(1)}%`)}`);
  }
  console.log();
}

async function cmdHealth() {
  const health = await getHealth();
  if (health.ok) {
    const h = health.data;
    console.log(`  ${c.green('●')} ${c.accent(h.status || 'ok')}`);
    if (h.accounts) console.log(`  ${c.dim('Accounts:')} ${h.accounts.available}/${h.accounts.total}`);
    if (h.tunnel) console.log(`  ${c.dim('Tunnel:')} ${h.tunnel.ready ? c.green('connected') : c.yellow('waiting')}`);
  } else {
    console.log(`  ${c.red('●')} Unreachable — ${health.error || health.status}`);
  }
  console.log();
}

async function cmdUrl() {
  const tunnel = await getTunnel();
  if (tunnel.ok && tunnel.data?.url) {
    console.log(`  ${c.accent(tunnel.data.url)}\n`);
  } else {
    console.log(`  ${c.yellow('⚠')} No tunnel URL.\n`);
  }
}

async function cmdModels() {
  const res = await getModels();
  if (res.ok && res.data?.data) {
    for (const m of res.data.data) {
      console.log(`  ${c.dim('•')} ${c.accent(m.id)}`);
    }
  } else {
    console.log(`  ${c.yellow('⚠')} Could not fetch models.\n`);
  }
  console.log();
}

async function cmdUsage() {
  const res = await getUsage();
  if (res.ok && res.data) {
    const d = res.data.byDay || [];
    for (const day of d.slice(0, 7)) {
      if (day.total > 0) {
        console.log(`  ${c.dim('•')} ${c.accent(day.date)} ${c.dim('-')} ${day.total} req ${c.dim('·')} ${day.tokens} tok`);
      }
    }
  } else {
    console.log(`  ${c.yellow('⚠')} No usage data.\n`);
  }
  console.log();
}

async function cmdPlugins() {
  const res = await getPlugins();
  if (res.ok && res.data?.plugins?.length) {
    for (const p of res.data.plugins) {
      console.log(`  ${c.dim('•')} ${c.accent(p.name || p.file || p)}`);
    }
  } else {
    console.log(`  ${c.dim('No plugins loaded.')}`);
  }
  console.log();
}

async function cmdAccounts() {
  const res = await getAccounts();
  if (res.ok && res.data) {
    const list = res.data.accounts || [];
    const active = list.filter(a => a.status === 'active').length;
    const failed = list.filter(a => a.status === 'failed').length;
    const banned = list.filter(a => a.status === 'banned').length;
    console.log(`  ${c.dim('Total:')} ${c.accent(String(list.length))} ${c.dim('· Active:')} ${c.green(String(active))}${failed ? c.dim(' · Failed:') + ' ' + c.yellow(String(failed)) : ''}${banned ? c.dim(' · Banned:') + ' ' + c.red(String(banned)) : ''}\n`);
  } else {
    console.log(`  ${c.yellow('⚠')} Could not fetch accounts.\n`);
  }
}

async function cmdKeys() {
  const { readEnv, parseApiKeys } = await import('../lib/config.js');
  const env = readEnv();
  const keys = parseApiKeys(env.API_KEYS);
  if (keys.length === 0) {
    console.log(`  ${c.dim('No API keys — requests are open.')}\n`);
  } else {
    for (const k of keys) {
      console.log(`  ${c.dim('•')} ${c.accent(k.length > 16 ? k.slice(0, 8) + '…' + k.slice(-4) : k)}`);
    }
    console.log();
  }
}

function showHost() {
  const name = getCurrentHost();
  const url = getCachedProxyUrl();
  console.log(`\n  ${c.bold('Active Host')}`);
  console.log(`  ${c.dim('Name:')} ${c.accent(name)}`);
  console.log(`  ${c.dim('URL:')}  ${c.accent(url)}`);
  console.log(`  ${c.dim('Type:')} ${isRemoteHost() ? c.green('remote') : c.green('local')}`);
  console.log();
}

function showTheme() {
  console.log();
  console.log(`  ${c.bold('DeepBridge Color Palette')}`);
  const swatches = [
    ['Background', palette.bg], ['Surface', palette.surface], ['Border', palette.border],
    ['Accent', palette.accent], ['Green', palette.green], ['Red', palette.red],
    ['Yellow', palette.yellow], ['Muted', palette.textMuted],
  ];
  for (const [name, hex] of swatches) {
    const block = c.hex(hex)('████');
    console.log(`  ${c.dim(name.padEnd(12))} ${block} ${c.dim(hex)}`);
  }
  console.log();
}

const COMMANDS = [
  'status', 'health', 'url', 'models', 'usage', 'plugins',
  'logs', 'up', 'down', 'restart',
  'accounts', 'account add', 'keys', 'key add',
  '.help', '.clear', '.exit', '.watch', '.theme', '.host',
];

function completer(line) {
  const hits = COMMANDS.filter(c => c.startsWith(line.toLowerCase()));
  return [hits.length ? hits : COMMANDS, line];
}

export async function start() {
  console.log(BANNER);

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: c.accent('dbh') + c.dim(' › '),
    completer,
    historySize: 50,
  });

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) { rl.prompt(); return; }
    STATE.history.push(trimmed);

    if (trimmed.startsWith('.')) {
      switch (trimmed) {
        case '.help': console.log(HELP_TEXT); break;
        case '.clear': console.clear(); console.log(BANNER); break;
        case '.exit': console.log(`  ${c.dim('bye')}\n`); process.exit(0); break;
        case '.host': showHost(); break;
        case '.theme': showTheme(); break;
        case '.watch':
          if (STATE.autoRefresh) {
            clearInterval(STATE.autoRefresh);
            STATE.autoRefresh = null;
            console.log(`  ${c.dim('auto-refresh stopped')}\n`);
          } else {
            STATE.autoRefresh = setInterval(async () => { await cmdStatus(); rl.prompt(); }, 5000);
            console.log(`  ${c.dim('auto-refresh started (every 5s)')}\n`);
          }
          break;
        default: console.log(`  ${c.dim('unknown:')} ${trimmed} ${c.dim('— try')} ${c.accent('.help')}\n`);
      }
      rl.prompt();
      return;
    }

    switch (trimmed) {
      case 'status': await cmdStatus(); break;
      case 'health': await cmdHealth(); break;
      case 'url': await cmdUrl(); break;
      case 'models': await cmdModels(); break;
      case 'usage': await cmdUsage(); break;
      case 'plugins': await cmdPlugins(); break;
      case 'accounts': await cmdAccounts(); break;
      case 'keys': await cmdKeys(); break;
      case 'logs': {
        if (isRemoteHost()) {
          console.log(`  ${c.yellow('⚠')} Logs require local Docker.\n`);
          break;
        }
        const { logs } = await import('../lib/docker.js');
        const child = logs({ follow: true, lines: 30 });
        await new Promise((resolve) => { child.on('exit', resolve); process.once('SIGINT', () => { child.kill(); resolve(); }); });
        console.log(`\n  ${c.dim('back to dbh')}\n`);
        break;
      }
      case 'up': {
        if (isRemoteHost()) { console.log(`  ${c.yellow('⚠')} Use ${c.accent('dbh use switch local')} for local control.\n`); break; }
        try { const { up } = await import('../lib/docker.js'); up({ detach: true }); console.log(`  ${badge.ok} ${c.green('started')}\n`); }
        catch (err) { console.log(`  ${c.red('✘')} ${err.message}\n`); }
        break;
      }
      case 'down': {
        if (isRemoteHost()) { console.log(`  ${c.yellow('⚠')} Use ${c.accent('dbh use switch local')} for local control.\n`); break; }
        try { const { down } = await import('../lib/docker.js'); down(); console.log(`  ${badge.ok} ${c.accent('stopped')}\n`); }
        catch (err) { console.log(`  ${c.red('✘')} ${err.message}\n`); }
        break;
      }
      case 'restart': {
        if (isRemoteHost()) { console.log(`  ${c.yellow('⚠')} Use ${c.accent('dbh use switch local')} for local control.\n`); break; }
        try { const { restart } = await import('../lib/docker.js'); restart(); console.log(`  ${badge.ok} ${c.green('restarted')}\n`); }
        catch (err) { console.log(`  ${c.red('✘')} ${err.message}\n`); }
        break;
      }
      case 'account add': {
        const { default: enquirer } = await import('enquirer');
        const { email, password } = await enquirer.prompt([
          { type: 'input', name: 'email', message: 'Email', validate: v => v.includes('@') },
          { type: 'password', name: 'password', message: 'Password' },
        ]);
        const { readEnv: r, writeEnv: w, parseAccounts: p } = await import('../lib/config.js');
        const env = r(); const accs = p(env.DEEPSEEK_ACCOUNTS); accs.push({ email, password: password || email }); w({ DEEPSEEK_ACCOUNTS: JSON.stringify(accs) });
        console.log(`  ${badge.ok} ${c.green('account added')}\n`);
        break;
      }
      case 'key add': {
        const { default: enquirer } = await import('enquirer');
        const { key } = await enquirer.prompt({ type: 'input', name: 'key', message: 'API key' });
        const { readEnv: r, writeEnv: w, parseApiKeys: pk } = await import('../lib/config.js');
        const env = r(); const kys = pk(env.API_KEYS); kys.push(key.trim()); w({ API_KEYS: JSON.stringify(kys) });
        console.log(`  ${badge.ok} ${c.green('key added')}\n`);
        break;
      }
      default:
        console.log(`  ${c.dim('unknown:')} ${trimmed} ${c.dim('— try')} ${c.accent('.help')}\n`);
    }
    rl.prompt();
  });

  rl.on('SIGINT', () => {
    if (STATE.autoRefresh) clearInterval(STATE.autoRefresh);
    console.log(`\n  ${c.dim('bye')}\n`);
    process.exit(0);
  });

  rl.prompt();
}
