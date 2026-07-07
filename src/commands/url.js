import { c } from '../ui/colors.js';
import { getTunnel } from '../lib/http.js';

export async function handler() {
  const tunnel = await getTunnel();

  if (tunnel.ok && tunnel.data?.url) {
    console.log(tunnel.data.url);
  } else if (tunnel.ok && tunnel.data?.customDomain) {
    console.log(tunnel.data.customDomain);
  } else {
    console.error(`${c.red('no tunnel URL available')} — is the proxy running?`);
    process.exit(1);
  }
}
