import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf8'));

async function loadCmd(name) {
  const mod = await import(`./commands/${name}.js`);
  return mod.default || mod;
}

export async function run() {
  const program = new Command();

  program
    .name('dbh')
    .description('DeepBridge Harness — CLI for managing DeepBridge proxy')
    .version(pkg.version)
    .option('--json', 'JSON output mode')
    .option('-q, --quiet', 'Suppress non-essential output');

  // ── Core lifecycle ─────────────────────────────────────
  program
    .command('up')
    .description('Start the proxy')
    .option('-d, --detach', 'Run in background', true)
    .option('--build', 'Rebuild image before starting')
    .action(async (opts) => { const cmd = await loadCmd('up'); await cmd.handler(opts); });

  program
    .command('down')
    .description('Stop the proxy')
    .action(async () => { const cmd = await loadCmd('down'); await cmd.handler(); });

  program
    .command('logs')
    .description('View proxy logs')
    .option('-f, --follow', 'Follow log output')
    .option('-n, --lines <count>', 'Number of lines', '50')
    .action(async (opts) => { const cmd = await loadCmd('logs'); await cmd.handler(opts); });

  program
    .command('restart')
    .description('Restart the proxy')
    .action(async () => { const cmd = await loadCmd('restart'); await cmd.handler(); });

  // ── Info ──────────────────────────────────────────────
  program
    .command('status')
    .description('Show proxy status dashboard')
    .action(async () => { const cmd = await loadCmd('status'); await cmd.handler(); });

  program
    .command('health')
    .description('Quick health check')
    .action(async () => { const cmd = await loadCmd('health'); await cmd.handler(); });

  program
    .command('url')
    .description('Get tunnel URL')
    .action(async () => { const cmd = await loadCmd('url'); await cmd.handler(); });

  program
    .command('models')
    .description('List available models')
    .action(async () => { const cmd = await loadCmd('models'); await cmd.handler(); });

  program
    .command('metrics')
    .description('Show Prometheus metrics')
    .action(async () => { const cmd = await loadCmd('metrics'); await cmd.handler(); });

  program
    .command('usage')
    .description('Show usage statistics')
    .action(async () => { const cmd = await loadCmd('usage'); await cmd.handler(); });

  program
    .command('plugins')
    .description('List loaded plugins')
    .action(async () => { const cmd = await loadCmd('plugins'); await cmd.handler(); });

  // ── Chat ───────────────────────────────────────────────
  program
    .command('chat')
    .description('Send a prompt to the proxy')
    .argument('[prompt]', 'Message to send')
    .option('-m, --model <model>', 'Model to use', 'default')
    .action(async (prompt, opts) => { const cmd = await loadCmd('chat'); await cmd.handler(prompt, opts.model); });

  // ── Tunnel ─────────────────────────────────────────────
  const tunnel = program.command('tunnel').description('Manage tunnel');
  tunnel.command('status').description('Show tunnel status').action(async () => { const cmd = await loadCmd('tunnel'); await cmd.status(); });
  tunnel.command('rotate').description('Rotate tunnel URL').action(async () => { const cmd = await loadCmd('tunnel'); await cmd.rotate(); });
  tunnel.command('restart').description('Restart tunnel process').action(async () => { const cmd = await loadCmd('tunnel'); await cmd.restart(); });

  // ── Webhooks ───────────────────────────────────────────
  const wh = program.command('webhook').description('Manage webhooks');
  wh.command('list').alias('ls').description('List deliveries').action(async () => { const cmd = await loadCmd('webhook'); await cmd.list(); });
  wh.command('test').description('Send test webhook').action(async () => { const cmd = await loadCmd('webhook'); await cmd.test(); });

  // ── Hosts (remote/local instances) ────────────────────
  const host = program.command('use').description('Manage proxy instances');
  host.command('list').alias('ls').description('List hosts').action(async () => { const cmd = await loadCmd('use'); await cmd.list(); });
  host.command('add').description('Add a host').action(async () => { const cmd = await loadCmd('use'); await cmd.add(); });
  host.command('remove').alias('rm').description('Remove a host').argument('<name>').action(async (n) => { const cmd = await loadCmd('use'); await cmd.remove(n); });
  host.command('switch').alias('select').description('Switch active host').argument('<name>').action(async (n) => { const cmd = await loadCmd('use'); await cmd.switchHost(n); });

  // ── Init ──────────────────────────────────────────────
  program
    .command('init')
    .description('Interactive setup wizard')
    .action(async () => { const cmd = await loadCmd('init'); await cmd.handler(); });

  // ── Accounts ───────────────────────────────────────────
  const account = program.command('account').description('Manage DeepSeek accounts');
  account.command('list').alias('ls').description('List accounts').action(async () => { const cmd = await loadCmd('account'); await cmd.list(); });
  account.command('add').description('Add an account').action(async () => { const cmd = await loadCmd('account'); await cmd.add(); });
  account.command('remove').alias('rm').description('Remove an account').argument('<email>').action(async (e) => { const cmd = await loadCmd('account'); await cmd.remove(e); });
  account.command('test').description('Test an account').argument('<email>').action(async (e) => { const cmd = await loadCmd('account'); await cmd.test(e); });

  // ── API Keys ──────────────────────────────────────────
  const key = program.command('key').description('Manage API keys');
  key.command('list').alias('ls').description('List keys').action(async () => { const cmd = await loadCmd('key'); await cmd.list(); });
  key.command('add').description('Add a key').action(async () => { const cmd = await loadCmd('key'); await cmd.add(); });
  key.command('remove').alias('rm').description('Remove a key').argument('<key>').action(async (k) => { const cmd = await loadCmd('key'); await cmd.remove(k); });

  // ── Config ────────────────────────────────────────────
  const cfg = program.command('config').description('Manage configuration');
  cfg.command('show').description('Show config').action(async () => { const cmd = await loadCmd('config'); await cmd.show(); });
  cfg.command('set').description('Set a value').argument('<key>').argument('<value>').action(async (k, v) => { const cmd = await loadCmd('config'); await cmd.set(k, v); });
  cfg.command('edit').description('Edit in editor').action(async () => { const cmd = await loadCmd('config'); await cmd.edit(); });

  // ── Other ──────────────────────────────────────────────
  program.command('backup').description('Backup data and config').action(async () => { const cmd = await loadCmd('backup'); await cmd.handler(); });
  program.command('update').description('Pull latest image and restart').action(async () => { const cmd = await loadCmd('update'); await cmd.handler(); });
  program.command('doctor').description('Run diagnostics').action(async () => { const cmd = await loadCmd('doctor'); await cmd.handler(); });
  program.command('repl').description('Interactive REPL mode').action(async () => { const mod = await import('./repl/index.js'); await mod.start(); });

  program
    .command('completion')
    .description('Generate shell completion')
    .argument('[shell]', 'bash or zsh', 'bash')
    .action(async (shell) => { const cmd = await loadCmd('completion'); await cmd.handler(shell); });

  program
    .command('install')
    .description('Install shell completion')
    .argument('[shell]', 'bash or zsh', 'bash')
    .action(async (shell) => {
      const { handler } = await loadCmd('completion');
      const { execSync } = await import('node:child_process');
      const { homedir } = await import('node:os');
      if (shell === 'bash') {
        const out = await handler(shell);
        const bashrc = require('node:path').join(homedir(), '.bashrc');
        require('node:fs').appendFileSync(bashrc, '\n' + out + '\n');
        console.log('  ${c.green('✔')} Completion installed for bash. Restart your shell.');
      } else if (shell === 'zsh') {
        const out = await handler(shell);
        const zshrc = require('node:path').join(homedir(), '.zshrc');
        require('node:fs').appendFileSync(zshrc, '\n' + out + '\n');
        console.log('  ${c.green('✔')} Completion installed for zsh. Restart your shell.');
      }
    });

  // ── Default: enter REPL if no args ────────────────────
  if (process.argv.length <= 2) {
    try {
      const mod = await import('./repl/index.js');
      await mod.start();
    } catch (err) {
      program.help();
    }
    return;
  }

  await program.parseAsync(process.argv);
}
