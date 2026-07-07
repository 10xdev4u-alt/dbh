import enquirer from 'enquirer';
import { c, badge } from '../ui/colors.js';
import { createTable } from '../ui/format.js';
import {
  listHosts, setCurrentHost, addHost, removeHost,
  getCurrentHost, getCurrentUrl, getCurrentKey,
} from '../lib/host.js';
import { getHealth } from '../lib/http.js';

export async function list() {
  const hosts = listHosts();
  console.log();
  if (hosts.length === 0) {
    console.log(`  ${c.dim('No hosts configured.')}`);
    console.log(`  ${c.dim('Add one:')} ${c.accent('dbh use add')}\n`);
    return;
  }
  const table = createTable(['Name', 'URL', 'Key', 'Current']);
  for (const h of hosts) {
    const cur = h.current ? c.green('●') : c.dim('○');
    const key = h.hasKey ? c.green('set') : c.dim('none');
    table.push([c.accent(h.name), h.url, key, cur]);
  }
  console.log(table.toString());
  console.log();
}

export async function switchHost(name) {
  try {
    setCurrentHost(name);
    const url = getCurrentUrl();
    // Quick health check
    const health = await getHealth(url);
    if (health.ok) {
      console.log(`\n  ${badge.ok} ${c.green(`Switched to ${name}`)} ${c.dim(`(${url})`)}`);
      console.log(`  ${c.dim('Status:')} ${c.green(health.data?.status || 'ok')}`);
    } else {
      console.log(`\n  ${badge.ok} ${c.accent(`Switched to ${name}`)} ${c.dim(`(${url})`)}`);
      console.log(`  ${c.yellow('⚠')} ${c.dim('Host unreachable — check connection')}`);
    }
    console.log();
  } catch (err) {
    console.error(`\n  ${c.red('✘')} ${err.message}\n`);
    process.exit(1);
  }
}

export async function add() {
  console.log();
  const { name, url, key } = await enquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Host name',
      initial: 'homelab',
      validate: (v) => v.trim() ? true : 'Name required',
    },
    {
      type: 'input',
      name: 'url',
      message: 'URL (e.g. http://192.168.1.124:3002)',
      validate: (v) => v.startsWith('http') ? true : 'Must start with http:// or https://',
    },
    {
      type: 'input',
      name: 'key',
      message: 'API key (optional)',
      initial: '',
    },
  ]);
  addHost(name.trim(), url.trim(), key.trim());
  setCurrentHost(name.trim());
  console.log(`\n  ${badge.ok} ${c.green(`Host ${name} added and active`)}\n`);
}

export async function remove(name) {
  try {
    removeHost(name);
    console.log(`\n  ${badge.ok} ${c.accent(`Removed host: ${name}`)}\n`);
  } catch (err) {
    console.error(`\n  ${c.red('✘')} ${err.message}\n`);
    process.exit(1);
  }
}

export async function interactive() {
  const hosts = listHosts();
  const current = getCurrentHost();
  const choices = hosts.map(h => ({
    name: h.name,
    message: `${h.current ? '● ' : '○ '} ${h.name} ${c.dim('(' + h.url + ')')}`,
  }));

  const { name } = await enquirer.prompt({
    type: 'select',
    name: 'name',
    message: 'Select host',
    choices,
    initial: choices.findIndex(c => c.name === current),
  });

  await switchHost(name);
}

export default { list, switchHost, add, remove, interactive };
