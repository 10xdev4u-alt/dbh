import { execSync } from 'node:child_process';
import { c } from '../ui/colors.js';
import { findProxyDir } from '../lib/config.js';

export async function handler(args) {
  const dir = findProxyDir() || process.cwd();
  const cmd = Array.isArray(args) ? args.join(' ') : args;
  try {
    const out = execSync(`docker compose -f ${dir}/docker-compose.yml exec -T deepbridge sh -c ${JSON.stringify(cmd)}`, {
      cwd: dir, stdio: 'inherit', timeout: 30000,
    });
  } catch (err) {
    if (err.status === undefined) {
      console.error(c.red(`exec failed: ${err.message}`));
      process.exit(1);
    }
    process.exit(err.status);
  }
}
