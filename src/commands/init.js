import enquirer from 'enquirer';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { c, badge, separator } from '../ui/colors.js';
import { section, kvLine } from '../ui/format.js';
import { writeEnv, readEnv, checkDocker, checkDockerCompose, findProxyDir, setProxyDir } from '../lib/config.js';
import { up } from '../lib/docker.js';
import { api } from '../lib/http.js';

export async function handler() {
  console.log();
  section('DeepBridge Setup Wizard');
  console.log(`  ${c.dim('This will guide you through configuring DeepBridge step by step.')}\n`);

  // Step 1: Project directory
  const { proxyDir } = await enquirer.prompt({
    type: 'input',
    name: 'proxyDir',
    message: 'DeepBridge project directory',
    initial: findProxyDir() || process.cwd(),
    validate: (v) => existsSync(resolve(v, 'docker-compose.yml')) || existsSync(resolve(v, 'Dockerfile'))
      ? true
      : 'No Dockerfile or docker-compose.yml found — create a new dir? (just press enter to use current dir)',
  });
  setProxyDir(resolve(proxyDir));
  console.log(`  ${badge.ok} ${c.dim('Project dir:')} ${c.accent(resolve(proxyDir))}\n`);

  // Step 2: DeepSeek accounts
  console.log(`  ${c.bold(c.accent('DeepSeek Accounts'))} ${c.dim('— at least one is required')}\n`);

  const accounts = [];
  let addMore = true;
  while (addMore) {
    const { email, password } = await enquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Account email',
        validate: (v) => v.includes('@') ? true : 'Enter a valid email',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password',
      },
    ]);
    accounts.push({ email, password: password || email });
    if (accounts.length >= 1) {
      const { more } = await enquirer.prompt({
        type: 'confirm',
        name: 'more',
        message: 'Add another account?',
        initial: false,
      });
      addMore = more;
    }
  }

  const accountsJson = JSON.stringify(accounts);
  console.log(`  ${badge.ok} ${c.dim(`${accounts.length} account(s) configured`)}\n`);

  // Step 3: API keys
  console.log(`  ${c.bold(c.accent('API Keys'))} ${c.dim('— optional, leave empty for no auth')}\n`);
  const keys = [];
  let addKey = true;
  while (addKey) {
    const { key } = await enquirer.prompt({
      type: 'input',
      name: 'key',
      message: 'API key (e.g. sk-yourkey)',
      initial: '',
    });
    if (key.trim()) keys.push(key.trim());
    if (keys.length >= 0) {
      const { more } = await enquirer.prompt({
        type: 'confirm',
        name: 'more',
        message: 'Add another key?',
        initial: false,
      });
      addKey = more;
    }
  }

  const keysJson = keys.length ? JSON.stringify(keys) : '[]';
  console.log(`  ${badge.ok} ${c.dim(`${keys.length} API key(s) configured`)}\n`);

  // Step 4: Discord bot (optional)
  console.log(`  ${c.bold(c.accent('Discord Bot'))} ${c.dim('— optional, for the levi_ bot')}\n`);
  const { discordToken, discordOwner } = await enquirer.prompt([
    {
      type: 'input',
      name: 'discordToken',
      message: 'Discord bot token (leave blank to skip)',
      initial: '',
    },
    {
      type: 'input',
      name: 'discordOwner',
      message: 'Your Discord user ID',
      initial: '',
    },
  ]);

  // Step 5: Advanced options
  console.log(`  ${c.bold(c.accent('Advanced'))} ${c.dim('— port, log level, etc.\n')}`);
  const { port, logLevel } = await enquirer.prompt([
    {
      type: 'input',
      name: 'port',
      message: 'Port',
      initial: '3002',
      validate: (v) => !isNaN(parseInt(v, 10)) ? true : 'Enter a valid port number',
    },
    {
      type: 'select',
      name: 'logLevel',
      message: 'Log level',
      choices: ['INFO', 'DEBUG', 'WARN', 'ERROR'],
      initial: 'INFO',
    },
  ]);

  // Write .env
  const envEntries = {
    PORT: port,
    LOG_LEVEL: logLevel,
    DEEPSEEK_ACCOUNTS: accountsJson,
    API_KEYS: keysJson,
  };
  if (discordToken.trim()) envEntries.DISCORD_BOT_TOKEN = discordToken.trim();
  if (discordOwner.trim()) envEntries.DISCORD_OWNER_ID = discordOwner.trim();

  writeEnv(envEntries, resolve(proxyDir));
  console.log(`  ${badge.ok} ${c.dim('.env written to')} ${c.accent(resolve(proxyDir, '.env'))}\n`);

  // Step 6: Start now?
  section('Done');
  console.log(`  ${c.green('✔')} Configuration complete!\n`);

  // Show summary
  section('Summary');
  kvLine('Accounts', c.accent(String(accounts.length)));
  kvLine('API Keys', c.accent(String(keys.length)));
  kvLine('Discord Bot', discordToken.trim() ? c.green('enabled') : c.dim('skipped'));
  kvLine('Port', c.accent(port));
  kvLine('Log Level', c.accent(logLevel));
  console.log();

  const { startNow } = await enquirer.prompt({
    type: 'confirm',
    name: 'startNow',
    message: 'Start DeepBridge now?',
    initial: true,
  });

  if (startNow) {
    console.log();
    section('Starting');
    const hasDocker = await checkDocker();
    if (!hasDocker) {
      console.log(`  ${c.yellow('⚠')} Docker not detected. Install Docker first, then run ${c.accent('dbh up')}`);
      return;
    }
    console.log(`  ${c.dim('Starting DeepBridge…')}`);
    up({ detach: true });
    console.log(`  ${badge.ok} ${c.green('DeepBridge is running!')}`);
    console.log(`\n  ${c.dim('Dashboard:')} ${c.accent(`http://localhost:${port}`)}`);
    console.log(`  ${c.dim('Admin:')}    ${c.accent(`http://localhost:${port}/admin.html`)}`);
  } else {
    console.log(`  ${c.dim('Run')} ${c.accent('dbh up')} ${c.dim('to start when ready.')}`);
  }

  console.log();
}
