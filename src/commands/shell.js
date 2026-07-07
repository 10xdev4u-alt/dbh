import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { c } from '../ui/colors.js';
import { findProxyDir } from '../lib/config.js';
import { getCurrentHost } from '../lib/host.js';

export async function handler({ shell: useShell = 'sh', json } = {}) {
  const host = getCurrentHost();

  if (host !== 'local') {
    if (json) {
      console.log(JSON.stringify({ error: 'shell not available for remote hosts', host }, null, 2));
    } else {
      console.log(c.yellow(`shell not available for remote host "${host}". Connect locally or use ssh.`));
    }
    return;
  }

  const dir = findProxyDir() || process.cwd();
  const composeFile = resolve(dir, 'docker-compose.yml');

  if (json) {
    console.log(JSON.stringify({ command: `docker compose exec -it deepbridge ${useShell}`, directory: dir }, null, 2));
    return;
  }

  console.log(c.dim(`Spawning ${useShell} in deepbridge container...\n`));

  const child = spawn('docker', ['compose', '-f', composeFile, 'exec', '-it', 'deepbridge', useShell], {
    cwd: dir,
    stdio: 'inherit',
    env: { ...process.env, TERM: process.env.TERM || 'xterm-256color' },
  });

  child.on('exit', (code) => process.exit(code ?? 0));
}
