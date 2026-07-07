import { c, badge } from '../ui/colors.js';
import { getHealth, getCachedProxyUrl } from '../lib/http.js';

export async function handler() {
  try {
    const health = await getHealth();

    if (health.ok) {
      const h = health.data;
      const status = h.status || 'ok';
      const ok = status === 'ok';
      console.log(ok ? c.green(status.toUpperCase()) : c.yellow(status.toUpperCase()));

      if (h.accounts) {
        console.log(`accounts: ${h.accounts.available}/${h.accounts.total} available`);
        if (h.accounts.banned > 0) console.log(`banned:   ${h.accounts.banned}`);
      }
      if (h.tunnel) {
        console.log(`tunnel:   ${h.tunnel.ready ? c.green('connected') : c.yellow('waiting')}`);
        if (h.tunnel.url) console.log(`  url:    ${h.tunnel.url}`);
      }
      process.exit(ok ? 0 : 1);
    } else {
      console.error(c.red('UNREACHABLE'));
      if (health.error === 'connection_refused') {
        console.error(`  Is DeepBridge running? Try ${c.accent('dbh up')}`);
      } else if (health.error) {
        console.error(`  ${health.error}`);
      }
      process.exit(1);
    }
  } catch (err) {
    console.error(c.red('ERROR'), err.message);
    process.exit(1);
  }
}
