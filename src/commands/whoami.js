import { getCurrentHost, getCurrentUrl, getCurrentKey, listHosts } from '../lib/host.js';
import { c } from '../ui/colors.js';

export async function handler({ json } = {}) {
  const hostName = getCurrentHost();
  const url = getCurrentUrl();
  const key = getCurrentKey();
  const hosts = listHosts();

  if (json) {
    console.log(JSON.stringify({
      active_host: hostName,
      url,
      has_api_key: !!key,
      key_prefix: key ? key.slice(0, 8) + '...' : null,
      total_hosts: Object.keys(hosts).length,
    }, null, 2));
    return;
  }

  console.log(`\n  ${c.bold('Active host:')}  ${c.cyan(hostName)}`);
  console.log(`  ${c.bold('URL:')}         ${c.dim(url)}`);
  console.log(`  ${c.bold('API Key:')}     ${key ? c.green('✓ configured') + ' ' + c.dim(key.slice(0, 12)+'…') : c.yellow('✗ none')}`);
  console.log(`  ${c.bold('Hosts:')}       ${c.dim(String(Object.keys(hosts).length) + ' total')}`);
  console.log('');
}
