import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf8'));

// Lazy-load commands so startup stays fast
async function loadCmd(name) {
  const mod = await import(`./commands/${name}.js`);
  return mod.default || mod;
}

export async function run() {
  const program = new Command();

  program
    .name('dbh')
    .description('DeepBridge Harness — Manage your DeepBridge proxy')
    .version(pkg.version)
    .option('--json', 'JSON output mode')
    .option('-q, --quiet', 'Suppress non-essential output');

  program
    .command('init')
    .description('Interactive setup wizard')
    .action(async () => { const cmd = await loadCmd('init'); await cmd.handler(); });

  program
    .command('up')
    .description('Start the DeepBridge proxy')
    .option('-d, --detach', 'Run in background', true)
    .option('--build', 'Rebuild image before starting')
    .action(async (opts) => { const cmd = await loadCmd('up'); await cmd.handler(opts); });

  program
    .command('down')
    .description('Stop the DeepBridge proxy')
    .action(async () => { const cmd = await loadCmd('down'); await cmd.handler(); });

  program
    .command('logs')
    .description('View proxy logs')
    .option('-f, --follow', 'Follow log output')
    .option('-n, --lines <count>', 'Number of lines to show', '50')
    .action(async (opts) => { const cmd = await loadCmd('logs'); await cmd.handler(opts); });

  program
    .command('restart')
    .description('Restart the proxy')
    .action(async () => { const cmd = await loadCmd('restart'); await cmd.handler(); });

  program
    .command('status')
    .description('Show proxy status dashboard')
    .action(async () => { const cmd = await loadCmd('status'); await cmd.handler(); });

  program
    .command('url')
    .description('Get the tunnel URL')
    .action(async () => { const cmd = await loadCmd('url'); await cmd.handler(); });

  program
    .command('health')
    .description('Check proxy health')
    .action(async () => { const cmd = await loadCmd('health'); await cmd.handler(); });

  const account = program.command('account')
    .description('Manage DeepSeek accounts');

  account
    .command('list')
    .alias('ls')
    .description('List all accounts')
    .action(async () => { const cmd = await loadCmd('account'); await cmd.list(); });

  account
    .command('add')
    .description('Add a DeepSeek account')
    .action(async () => { const cmd = await loadCmd('account'); await cmd.add(); });

  account
    .command('remove')
    .alias('rm')
    .description('Remove an account')
    .argument('<email>', 'Account email')
    .action(async (email) => { const cmd = await loadCmd('account'); await cmd.remove(email); });

  account
    .command('test')
    .description('Test an account login')
    .argument('<email>', 'Account email')
    .action(async (email) => { const cmd = await loadCmd('account'); await cmd.test(email); });

  const key = program.command('key')
    .description('Manage API keys');

  key
    .command('list')
    .alias('ls')
    .description('List all API keys')
    .action(async () => { const cmd = await loadCmd('key'); await cmd.list(); });

  key
    .command('add')
    .description('Add an API key')
    .action(async () => { const cmd = await loadCmd('key'); await cmd.add(); });

  key
    .command('remove')
    .alias('rm')
    .description('Remove an API key')
    .argument('<key>', 'API key to remove')
    .action(async (keyVal) => { const cmd = await loadCmd('key'); await cmd.remove(keyVal); });

  const configCmd = program.command('config')
    .description('Manage configuration');

  configCmd
    .command('show')
    .description('Show current configuration')
    .action(async () => { const cmd = await loadCmd('config'); await cmd.show(); });

  configCmd
    .command('set')
    .description('Set a config value')
    .argument('<key>', 'Config key')
    .argument('<value>', 'Config value')
    .action(async (key, value) => { const cmd = await loadCmd('config'); await cmd.set(key, value); });

  configCmd
    .command('edit')
    .description('Open config in editor')
    .action(async () => { const cmd = await loadCmd('config'); await cmd.edit(); });

  program
    .command('backup')
    .description('Backup proxy data and config')
    .action(async () => { const cmd = await loadCmd('backup'); await cmd.handler(); });

  program
    .command('update')
    .description('Pull latest image and restart')
    .action(async () => { const cmd = await loadCmd('update'); await cmd.handler(); });

  program
    .command('doctor')
    .description('Run diagnostics')
    .action(async () => { const cmd = await loadCmd('doctor'); await cmd.handler(); });

  program
    .command('repl')
    .description('Interactive REPL mode')
    .action(async () => { const mod = await import('./repl/index.js'); await mod.start(); });

  // Default: show help or enter REPL if called with no args
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
