import { c, badge, separator } from '../ui/colors.js';
import { restart as dockerRestart, isRunning } from '../lib/docker.js';

export async function handler() {
  console.log();
  separator('Restarting DeepBridge');

  if (!isRunning()) {
    console.log(`  ${c.yellow('⚠')} DeepBridge is not running. Use ${c.accent('dbh up')} first.\n`);
    process.exit(1);
  }

  try {
    const result = dockerRestart();
    console.log(`  ${badge.ok} ${c.green('DeepBridge restarted')} ${c.dim(`(${result.method})`)}\n`);
  } catch (err) {
    console.log(`\n  ${c.red('✘')} Failed to restart: ${err.message}\n`);
    process.exit(1);
  }
}
