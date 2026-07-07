import { c, badge, separator } from '../ui/colors.js';
import { section } from '../ui/format.js';
import { pull, up, down, isRunning } from '../lib/docker.js';

export async function handler() {
  console.log();
  separator('Updating DeepBridge');

  // Pull latest image
  console.log(`  ${c.dim('Pulling latest image…')}\n`);
  try {
    pull();
    console.log(`  ${badge.ok} ${c.green('Image updated')}\n`);
  } catch (err) {
    console.log(`  ${c.red('✘')} Pull failed: ${err.message}\n`);
    process.exit(1);
  }

  // Restart
  section('Restarting');
  if (isRunning()) {
    console.log(`  ${c.dim('Restarting container…')}`);
    try {
      down();
      up({ detach: true });
      console.log(`  ${badge.ok} ${c.green('DeepBridge updated and restarted')}\n`);
    } catch (err) {
      console.log(`  ${c.red('✘')} Restart failed: ${err.message}\n`);
      process.exit(1);
    }
  } else {
    console.log(`  ${c.dim('Container was not running. Start with:')} ${c.accent('dbh up')}\n`);
  }
}
