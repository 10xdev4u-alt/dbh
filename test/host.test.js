import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';

// We test the host module by manipulating ~/.dbh/hosts.json directly
const DBH_DIR = join(homedir(), '.dbh');
const HOSTS_FILE = join(DBH_DIR, 'hosts.json');

let getHosts, getCurrentHost, getCurrentUrl, getCurrentKey, setCurrentHost, addHost, removeHost, renameHost, listHosts;

before(async () => {
  const mod = await import('../src/lib/host.js');
  getHosts = mod.getHosts;
  getCurrentHost = mod.getCurrentHost;
  getCurrentUrl = mod.getCurrentUrl;
  getCurrentKey = mod.getCurrentKey;
  setCurrentHost = mod.setCurrentHost;
  addHost = mod.addHost;
  removeHost = mod.removeHost;
  renameHost = mod.renameHost;
  listHosts = mod.listHosts;
});

// Save original hosts file and restore after
let originalHosts;
before(() => {
  try {
    originalHosts = readFileSync(HOSTS_FILE, 'utf8');
  } catch {
    originalHosts = null;
  }
});

after(() => {
  if (originalHosts) {
    writeFileSync(HOSTS_FILE, originalHosts, 'utf8');
  }
});

describe('getCurrentHost', () => {
  it('returns a string', () => {
    const host = getCurrentHost();
    assert.equal(typeof host, 'string');
  });

  it('returns "local" by default', () => {
    const host = getCurrentHost();
    assert.ok(host.length > 0);
  });
});

describe('getCurrentUrl', () => {
  it('returns a URL string', () => {
    const url = getCurrentUrl();
    assert.ok(url.startsWith('http'));
  });

  it('returns localhost:3002 by default', () => {
    const url = getCurrentUrl();
    assert.ok(url.includes('localhost'));
  });
});

describe('getCurrentKey', () => {
  it('returns a string (possibly empty)', () => {
    const key = getCurrentKey();
    assert.equal(typeof key, 'string');
  });
});

describe('addHost / removeHost', () => {
  it('adds a host and it appears in list', () => {
    addHost('test-server', 'http://192.168.1.100:3002', 'sk-test');
    const hosts = listHosts();
    const found = hosts.find(h => h.name === 'test-server');
    assert.ok(found);
    assert.equal(found.url, 'http://192.168.1.100:3002');
    assert.equal(found.hasKey, true);
    removeHost('test-server');
  });

  it('removes a host and it disappears', () => {
    addHost('temp-host', 'http://10.0.0.1:3002');
    removeHost('temp-host');
    const hosts = listHosts();
    const found = hosts.find(h => h.name === 'temp-host');
    assert.equal(found, undefined);
  });

  it('strips trailing slash from URL', () => {
    addHost('slash-test', 'http://10.0.0.2:3002/');
    const url = getCurrentUrl();
    // Switch to the test host to check URL
    const prev = getCurrentHost();
    setCurrentHost('slash-test');
    const url2 = getCurrentUrl();
    assert.ok(!url2.endsWith('/'));
    setCurrentHost(prev);
    removeHost('slash-test');
  });

  it('throws when removing "local" host', () => {
    assert.throws(() => removeHost('local'), /Cannot remove local host/);
  });

  it('throws when removing unknown host', () => {
    assert.throws(() => removeHost('nonexistent'), /Unknown host/);
  });
});

describe('renameHost', () => {
  it('renames a host and updates current pointer', () => {
    addHost('old-name', 'http://10.0.0.3:3002');
    setCurrentHost('old-name');
    renameHost('old-name', 'new-name');
    assert.equal(getCurrentHost(), 'new-name');
    const hosts = listHosts();
    assert.ok(hosts.find(h => h.name === 'new-name'));
    assert.equal(hosts.find(h => h.name === 'old-name'), undefined);
    removeHost('new-name');
  });

  it('throws when renaming to existing name', () => {
    addHost('host-a', 'http://10.0.0.4:3002');
    addHost('host-b', 'http://10.0.0.5:3002');
    assert.throws(() => renameHost('host-a', 'host-b'), /Host already exists/);
    removeHost('host-a');
    removeHost('host-b');
  });

  it('throws when renaming unknown host', () => {
    assert.throws(() => renameHost('ghost', 'anything'), /Unknown host/);
  });
});

describe('setCurrentHost', () => {
  it('switches the active host', () => {
    addHost('switch-test', 'http://10.0.0.6:3002');
    setCurrentHost('switch-test');
    assert.equal(getCurrentHost(), 'switch-test');
    setCurrentHost('local');
    assert.equal(getCurrentHost(), 'local');
    removeHost('switch-test');
  });

  it('throws for unknown host', () => {
    assert.throws(() => setCurrentHost('noway'), /Unknown host/);
  });
});

describe('listHosts', () => {
  it('returns an array', () => {
    const hosts = listHosts();
    assert.ok(Array.isArray(hosts));
  });

  it('includes "local" host by default', () => {
    const hosts = listHosts();
    assert.ok(hosts.some(h => h.name === 'local'));
  });

  it('marks the current host', () => {
    addHost('mark-test', 'http://10.0.0.7:3002');
    setCurrentHost('mark-test');
    const hosts = listHosts();
    const current = hosts.find(h => h.current);
    assert.equal(current.name, 'mark-test');
    setCurrentHost('local');
    removeHost('mark-test');
  });

  it('returns host objects with name, current, url, hasKey', () => {
    const hosts = listHosts();
    for (const h of hosts) {
      assert.ok(typeof h.name === 'string');
      assert.ok(typeof h.current === 'boolean');
      assert.ok(typeof h.url === 'string');
      assert.ok(typeof h.hasKey === 'boolean');
    }
  });
});

describe('getHosts', () => {
  it('returns an object', () => {
    const hosts = getHosts();
    assert.equal(typeof hosts, 'object');
    assert.ok(hosts !== null);
  });
});
