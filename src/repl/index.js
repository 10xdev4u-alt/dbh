import { createInterface } from 'node:readline';
import { c, palette, badge, separator } from '../ui/colors.js';
import { section, statusLine, kvLine, kvGrid } from '../ui/format.js';
import { isRunning } from '../lib/docker.js';
import { getHealth, getTunnel, getAccounts, getSummary, getCachedProxyUrl } from '../lib/http.js';

// ── REPL state ────────────────────────────────────────────
const STATE = {
  running: false,
  history: [],
  autoRefresh: null,
  tunnelUrl: null,
  accountCount: 0,
};

// ── BANNER ────────────────────────────────────────────────
const BANNER = `
  ${c.accent('⌬')} ${c.bold('dbh')} ${c.dim('— DeepBridge Harness')}
  ${c.dim('Type')} ${c.accent('.help')} ${c.dim('for commands or press Tab to autocomplete.')}
  ${c.dim('Try:')} ${c.accent('status')} ${c.dim('·')} ${c.accent('url')} ${c.dim('·')} ${c.accent('logs')}
`;

const HELP_TEXT = `
  ${c.bold('Commands')}
  ${c.dim('───────────────────────────────────────')}
  ${c.accent('status')}      Show full proxy status
  ${c.accent('health')}      Quick health check
  ${c.accent('url')}         Get tunnel URL
  ${c.accent('logs')}        View proxy logs
  ${c.accent('up')}          Start the proxy
  ${c.accent('down')}        Stop the proxy
  ${c.accent('restart')}     Restart the proxy

  ${c.bold('Accounts')}
  ${c.accent('accounts')}    List DeepSeek accounts
  ${c.accent('account add')} Add an account (opens wizard)

  ${c.bold('Keys')}
  ${c.accent('keys')}        List API keys
  ${c.accent('key add')}     Add an API key

  ${c.bold('Dot Commands')}
  ${c.accent('.help')}       Show this help
  ${c.accent('.clear')}      Clear screen
  ${c.accent('.exit')}       Exit REPL
  ${c.accent('.watch')}      Toggle auto-refresh (polls every 5s)
  ${c.accent('.theme')}      Show current theme colors

  ${c.dim('Tip: commands run in the context of the proxy.')}
  ${c.dim('Make sure DeepBridge is running.')}
`;

// ── Command handlers ──────────────────────────────────────

async function cmdStatus() {
  console.log();
  section('Status');

  const running = isRunning();
  statusLine('Container', running ? 'running' : 'stopped', running);
  STATE.running = running;

  if (!running) {
    console.log(`\n  ${c.dim('Start it:')} ${c.accent('dbh up')}\n`);
    return;
  }

  const health = await getHealth();
  if (health.ok) {
    const h = health.data;
    statusLine('API', h.status || 'ok', h.status === 'ok');
    if (h.accounts) statusLine('Accounts', `${h.accounts.available}/${h.accounts.total}`, h.accounts.available > 0);
    if (h.tunnel) {
      statusLine('Tunnel', h.tunnel.ready ? 'connected' : 'waiting…', !!h.tunnel.ready);
      STATE.tunnelUrl = h.tunnel.url || null;
    }
  }

  const tunnel = await getTunnel();
  if (tunnel.ok && tunnel.data?.url) {
    STATE.tunnelUrl = tunnel.data.url;
  }

  const summary = await getSummary();
  if (summary.ok && summary.data) {
    const s = summary.data;
    console.log(`  ${c.dim('Requests:')} ${c.accent(String(s.totalRequests || 0))} ${c.dim('· Latency:')} ${c.accent(`${s.avgLatency || 0}ms`)} ${c.dim('· Success:')} ${s.successRate >= 0.99 ? c.green(`${(s.successRate * 100).toFixed(1)}%`) : c.yellow(`${(s.successRate * 100).toFixed(1)}%`)}`);
  }
  console.log();
}

async function cmdHealth() {
  const running = isRunning();
  if (!running) {
    console.log(`  ${c.yellow('⚠')} Not running.\n`);
    return;
  }
  const health = await getHealth();
  if (health.ok) {
    const h = health.data;
    console.log(`  ${c.green('●')} ${c.accent(h.status || 'ok')}`);
    if (h.accounts) console.log(`  ${c.dim('Accounts:')} ${h.accounts.available}/${h.accounts.total}`);
    if (h.tunnel) console.log(`  ${c.dim('Tunnel:')} ${h.tunnel.ready ? c.green('connected') : c.yellow('waiting')}`);
  } else {
    console.log(`  ${c.red('●')} Unreachable\n`);
  }
}

async function cmdUrl() {
  const tunnel = await getTunnel();
  if (tunnel.ok && tunnel.data?.url) {
    console.log(`  ${c.accent(tunnel.data.url)}\n`);
    STATE.tunnelUrl = tunnel.data.url;
  } else {
    console.log(`  ${c.yellow('⚠')} No tunnel URL yet.\n`);
  }
}

async function cmdAccounts() {
  const accounts = await getAccounts();
  if (accounts.ok && accounts.data) {
    const list = accounts.data.accounts || [];
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
    console.log(`  ${c.dim(`${keys.length} key(s):`)}`);
    for (const k of keys) {
      console.log(`  ${c.dim('•')} ${c.accent(k.length > 16 ? k.slice(0, 8) + '…' + k.slice(-4) : k)}`);
    }
    console.log();
  }
}

function showTheme() {
  console.log();
  console.log(`  ${c.bold('DeepBridge Color Palette')}`);
  console.log(`  ${c.dim('───────────────────────────────────')}`);
  const swatches = [
    ['Background', '  ████████ ', palette.bg],
    ['Surface', '  ████████ ', palette.surface],
    ['Border', '  ████████ ', palette.border],
    ['Accent', '  ████████ ', palette.accent],
    ['Green', '  ████████ ', palette.green],
    ['Red', '  ████████ ', palette.red],
    ['Yellow', '  ████████ ', palette.yellow],
    ['Muted', '  ████████ ', palette.textMuted],
  ];
  for (const [name, block, hex] of swatches) {
    const colored = block.replace(/█/g, c.hex(hex)('█'));
    console.log(`  ${c.dim(name.padEnd(12))} ${colored} ${c.dim(hex)}`);
  }
  console.log();
}

// ── REPL Loop ─────────────────────────────────────────────

const COMMANDS = [
  'status', 'health', 'url', 'logs', 'up', 'down', 'restart',
  'accounts', 'account add',
  'keys', 'key add',
  '.help', '.clear', '.exit', '.watch', '.theme',
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

    // ── Dot commands ────────────────────────────────────
    if (trimmed.startsWith('.')) {
      switch (trimmed) {
        case '.help':
          console.log(HELP_TEXT);
          break;
        case '.clear':
          console.clear();
          console.log(BANNER);
          break;
        case '.exit':
          console.log(`  ${c.dim('bye')}\n`);
          process.exit(0);
          break;
        case '.watch':
          if (STATE.autoRefresh) {
            clearInterval(STATE.autoRefresh);
            STATE.autoRefresh = null;
            console.log(`  ${c.dim('auto-refresh stopped')}\n`);
          } else {
            console.log(`  ${c.dim('auto-refresh started (every 5s)')}\n`);
            STATE.autoRefresh = setInterval(async () => {
              await cmdStatus();
              rl.prompt();
            }, 5000);
          }
          break;
        case '.theme':
          showTheme();
          break;
        default:
          console.log(`  ${c.dim('unknown command:')} ${trimmed}\n`);
      }
      rl.prompt();
      return;
    }

    // ── Regular commands ─────────────────────────────────
    switch (trimmed) {
      case 'status':
        await cmdStatus();
        break;
      case 'health':
        await cmdHealth();
        break;
      case 'url':
        await cmdUrl();
        break;
      case 'logs': {
        const { logs, isRunning: dockerRunning } = await import('../lib/docker.js');
        const isRunning = dockerRunning;
        if (!isRunning()) {
          console.log(`  ${c.yellow('⚠')} Not running.\n`);
          break;
        }
        console.log(`  ${c.dim('Showing logs (Ctrl+C to stop)…')}\n`);
        const child = logs({ follow: true, lines: 30 });
        await new Promise((resolve) => {
          child.on('exit', resolve);
          process.once('SIGINT', () => { child.kill(); resolve(); });
        });
        console.log(`\n  ${c.dim('back to dbh')}\n`);
        break;
      }
      case 'up': {
        try {
          const { up } = await import('../lib/docker.js');
          up({ detach: true });
          console.log(`  ${badge.ok} ${c.green('started')}\n`);
        } catch (err) {
          console.log(`  ${c.red('✘')} ${err.message}\n`);
        }
        break;
      }
      case 'down': {
        try {
          const { down } = await import('../lib/docker.js');
          down();
          console.log(`  ${badge.ok} ${c.accent('stopped')}\n`);
        } catch (err) {
          console.log(`  ${c.red('✘')} ${err.message}\n`);
        }
        break;
      }
      case 'restart': {
        try {
          const { restart } = await import('../lib/docker.js');
          restart();
          console.log(`  ${badge.ok} ${c.green('restarted')}\n`);
        } catch (err) {
          console.log(`  ${c.red('✘')} ${err.message}\n`);
        }
        break;
      }
      case 'accounts':
        await cmdAccounts();
        break;
      case 'keys':
        await cmdKeys();
        break;
      case 'account add': {
        const { handler } = await import('../commands/init.js');
        // Just run the account part
        const { default: enquirer } = await import('enquirer');
        const { email, password } = await enquirer.prompt([
          { type: 'input', name: 'email', message: 'Email', validate: v => v.includes('@') ? true : 'valid email required' },
          { type: 'password', name: 'password', message: 'Password' },
        ]);
        const { readEnv: cfgRead, writeEnv: cfgWrite, parseAccounts: cfgParse } = await import('../lib/config.js');
        const env = cfgRead();
        const accounts = cfgParse(env.DEEPSEEK_ACCOUNTS);
        accounts.push({ email, password: password || email });
        cfgWrite({ DEEPSEEK_ACCOUNTS: JSON.stringify(accounts) });
        console.log(`  ${badge.ok} ${c.green('account added — restart to apply')}\n`);
        break;
      }
      case 'key add': {
        const { default: enquirer } = await import('enquirer');
        const { key } = await enquirer.prompt({ type: 'input', name: 'key', message: 'API key' });
        const { readEnv: cfgRead2, writeEnv: cfgWrite2, parseApiKeys: cfgParseKeys } = await import('../lib/config.js');
        const env = cfgRead2();
        const keys = cfgParseKeys(env.API_KEYS);
        keys.push(key.trim());
        cfgWrite2({ API_KEYS: JSON.stringify(keys) });
        console.log(`  ${badge.ok} ${c.green('key added — restart to apply')}\n`);
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
