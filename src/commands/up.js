import { c, badge, separator } from '../ui/colors.js';
import { checkDocker, checkDockerCompose } from '../lib/config.js';
import { up as dockerUp } from '../lib/docker.js';
import { getCachedProxyUrl } from '../lib/http.js';

export async function handler(opts = {}) {
  const hasDocker = await checkDocker();
  if (!hasDocker) {
    console.log(`\n  ${c.red('✘')} Docker is not available.`);
    console.log(`  ${c.dim('Install Docker first, then try again.')}\n`);
    process.exit(1);
  }

  const hasCompose = await checkDockerCompose();
  if (!hasCompose) {
    console.log(`\n  ${c.red('✘')} Docker Compose is not available.`);
    console.log(`  ${c.dim('Install Docker Compose first, then try again.')}\n`);
    process.exit(1);
  }

  console.log();
  separator('Starting DeepBridge');

  try {
    const result = dockerUp({ detach: opts.detach !== false, build: !!opts.build });
    console.log(`  ${badge.ok} ${c.green('DeepBridge is starting')}`);
    console.log(`  ${c.dim('Project:')} ${c.accent(result.dir)}`);
    console.log();
    console.log(`  ${c.dim('Wait a few seconds, then:')}`);
    console.log(`  ${c.dim('Dashboard:')} ${c.accent('http://localhost:3002')}`);
    console.log(`  ${c.dim('Admin:')}    ${c.accent('http://localhost:3002/admin.html')}`);
    console.log(`  ${c.dim('Status:')}   ${c.accent('dbh status')}`);
    console.log(`  ${c.dim('Logs:')}     ${c.accent('dbh logs -f')}`);
    console.log();
  } catch (err) {
    console.log(`\n  ${c.red('✘')} Failed to start: ${err.message}\n`);
    process.exit(1);
  }
}
