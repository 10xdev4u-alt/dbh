import chalk from 'chalk';
import Table from 'cli-table3';
import cliProgress from 'cli-progress';
import { palette, c } from './colors.js';

// ── Table builder ─────────────────────────────────────────
export function createTable(headers, opts = {}) {
  const head = headers.map(h => chalk.hex(palette.textMuted)(h.toUpperCase()));
  return new Table({
    head,
    style: {
      head: [],
      border: [],
      'padding-left': 1,
      'padding-right': 1,
    },
    chars: {
      top: '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      left: '│', 'left-mid': '├', mid: '─', 'mid-mid': '┼',
      right: '│', 'right-mid': '┤', middle: '│',
    },
    ...opts,
  });
}

// ── Progress bar ──────────────────────────────────────────
export function createProgressBar(total, label = '') {
  const bar = new cliProgress.SingleBar({
    format: `${c.dim(label)} ${chalk.hex(palette.accent)('{bar}')} {percentage}% | {value}/{total}`,
    barCompleteChar: '█',
    barIncompleteChar: '░',
    clearOnComplete: true,
    hideCursor: true,
  }, cliProgress.Presets.shades_classic);
  bar.start(total, 0);
  return bar;
}

// ── Spinner helpers ───────────────────────────────────────
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let spinnerTimer = null;
let spinnerFrame = 0;

export function startSpinner(text = '') {
  stopSpinner();
  spinnerFrame = 0;
  process.stdout.write(c.dim(SPINNER_FRAMES[0]) + ' ' + text);
  spinnerTimer = setInterval(() => {
    spinnerFrame = (spinnerFrame + 1) % SPINNER_FRAMES.length;
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(c.dim(SPINNER_FRAMES[spinnerFrame]) + ' ' + text);
  }, 100);
}

export function stopSpinner(text = '') {
  if (spinnerTimer) {
    clearInterval(spinnerTimer);
    spinnerTimer = null;
  }
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  if (text) process.stdout.write(text);
}

export function succeedSpinner(text = '') {
  const msg = c.green('✔') + ' ' + text;
  stopSpinner(msg + '\n');
}

export function failSpinner(text = '') {
  const msg = c.red('✘') + ' ' + text;
  stopSpinner(msg + '\n');
}

// ── Status line ───────────────────────────────────────────
export function statusLine(label, value, ok = true) {
  const icon = ok ? c.green('●') : c.red('○');
  const val = ok ? c.accent(value) : c.dim(value || 'offline');
  console.log(`  ${icon} ${c.dim(label + ':')} ${val}`);
}

export function kvLine(key, value) {
  console.log(`  ${c.dim(key + ':')} ${value}`);
}

// ── Key/value grid ────────────────────────────────────────
export function kvGrid(rows) {
  const keyWidth = Math.max(...rows.map(r => r[0].length)) + 2;
  for (const [k, v] of rows) {
    console.log(`  ${c.dim(k.padEnd(keyWidth))}${v}`);
  }
}

// ── Section header ────────────────────────────────────────
export function section(title) {
  const w = process.stdout.columns || 80;
  const line = '─'.repeat(Math.max(2, w - title.length - 4));
  console.log(`\n  ${chalk.hex(palette.accent).bold(title)} ${c.dim(line)}`);
}

// ── Wrap text ─────────────────────────────────────────────
export function wrapText(text, indent = 2) {
  const w = (process.stdout.columns || 80) - indent * 2;
  const pad = ' '.repeat(indent);
  const words = text.split(' ');
  let line = pad;
  for (const word of words) {
    if (line.length + word.length + 1 > w) {
      console.log(line);
      line = pad + word;
    } else {
      line += (line === pad ? '' : ' ') + word;
    }
  }
  if (line) console.log(line);
}
