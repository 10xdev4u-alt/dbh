import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

const DBH_DIR = resolve(homedir(), '.dbh');
if (!existsSync(DBH_DIR)) mkdirSync(DBH_DIR, { recursive: true });

const HOSTS_FILE = resolve(DBH_DIR, 'hosts.json');

function loadHosts() {
  try {
    if (existsSync(HOSTS_FILE)) {
      return JSON.parse(readFileSync(HOSTS_FILE, 'utf8'));
    }
  } catch {}
  return {
    current: 'local',
    hosts: {
      local: { url: 'http://localhost:3002', key: '' },
    },
  };
}

function saveHosts(data) {
  writeFileSync(HOSTS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export function getHosts() {
  return loadHosts().hosts || {};
}

export function getCurrentHost() {
  return loadHosts().current || 'local';
}

export function getCurrentUrl() {
  const data = loadHosts();
  const host = data.hosts?.[data.current];
  return host?.url || 'http://localhost:3002';
}

export function getCurrentKey() {
  const data = loadHosts();
  const host = data.hosts?.[data.current];
  return host?.key || '';
}

export function setCurrentHost(name) {
  const data = loadHosts();
  if (!data.hosts[name]) throw new Error(`Unknown host: ${name}`);
  data.current = name;
  saveHosts(data);
}

export function addHost(name, url, key = '') {
  const data = loadHosts();
  data.hosts[name] = { url: url.replace(/\/+$/, ''), key };
  if (!data.current) data.current = name;
  saveHosts(data);
}

export function removeHost(name) {
  const data = loadHosts();
  if (name === 'local') throw new Error('Cannot remove local host');
  if (!data.hosts[name]) throw new Error(`Unknown host: ${name}`);
  delete data.hosts[name];
  if (data.current === name) data.current = 'local';
  saveHosts(data);
}

export function renameHost(oldName, newName) {
  const data = loadHosts();
  if (!data.hosts[oldName]) throw new Error(`Unknown host: ${oldName}`);
  if (data.hosts[newName]) throw new Error(`Host already exists: ${newName}`);
  data.hosts[newName] = data.hosts[oldName];
  delete data.hosts[oldName];
  if (data.current === oldName) data.current = newName;
  saveHosts(data);
}

export function listHosts() {
  const data = loadHosts();
  return Object.entries(data.hosts || {}).map(([name, cfg]) => ({
    name,
    current: name === data.current,
    url: cfg.url,
    hasKey: !!cfg.key,
  }));
}
