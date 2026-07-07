import { c, badge } from '../ui/colors.js';
import { logs as dockerLogs, isRunning, getContainerId } from '../lib/docker.js';

export async function handler(opts = {}) {
  if (!isRunning()) {
    console.log(`\n  ${c.yellow('⚠')} DeepBridge is not running.\n`);
    process.exit(1);
  }

  const child = dockerLogs({ follow: opts.follow, lines: parseInt(opts.lines, 10) || 50 });

  // Wait for the process to exit (Ctrl+C)
  return new Promise((resolve) => {
    child.on('exit', () => resolve());
    process.on('SIGINT', () => {
      child.kill('SIGINT');
      resolve();
    });
  });
}
