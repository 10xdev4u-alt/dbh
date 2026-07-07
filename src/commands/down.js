import { c, badge, separator } from '../ui/colors.js';
import { down as dockerDown, isRunning } from '../lib/docker.js';

export async function handler() {
  console.log();
  separator('Stopping DeepBridge');

  if (!isRunning()) {
    console.log(`  ${c.yellow('⚠')} DeepBridge is not running.\n`);
    return;
  }

  try {
    dockerDown();
    console.log(`  ${badge.ok} ${c.accent('DeepBridge stopped')}\n`);
  } catch (err) {
    console.log(`\n  ${c.red('✘')} Failed to stop: ${err.message}\n`);
    process.exit(1);
  }
}
