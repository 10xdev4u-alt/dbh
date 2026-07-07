import chalk from 'chalk';

// DeepBridge color palette
export const palette = {
  bg: '#000000',
  surface: '#1F150C',
  border: '#412D15',
  borderHover: '#8A6A3D',
  accent: '#E1DCC9',
  accentDim: 'rgba(225, 220, 201, 0.12)',
  green: '#B8C99D',
  red: '#C97B5C',
  yellow: '#D4B886',
  purple: '#8B6F47',
  text: '#E1DCC9',
  textDim: '#B8AC91',
  textMuted: '#8A7E66',
};

// Chalk-wrapped helpers
export const c = {
  accent: chalk.hex(palette.accent),
  green: chalk.hex(palette.green),
  red: chalk.hex(palette.red),
  yellow: chalk.hex(palette.yellow),
  dim: chalk.hex(palette.textDim),
  muted: chalk.hex(palette.textMuted),
  purple: chalk.hex(palette.purple),
  bold: chalk.bold,
  italic: chalk.italic,
  surface: chalk.hex(palette.surface),
  border: chalk.hex(palette.border),
};

// Status badge helpers
export const badge = {
  ok: c.green('✔'),
  fail: c.red('✘'),
  warn: c.yellow('⚠'),
  info: c.accent('ℹ'),
  arrow: c.dim('→'),
  dot: c.dim('·'),
};

// Prefix for log lines
export function prefix(emoji = '', text = '') {
  return `${c.dim('[')}${emoji}${c.dim(']')} ${text}`;
}

// Header separator
export function separator(title = '') {
  const line = '─'.repeat(process.stdout.columns ? Math.min(process.stdout.columns - title.length - 2, 48) : 48);
  if (title) {
    console.log(`\n  ${c.bold(c.accent(title))} ${c.dim(line)}\n`);
  } else {
    console.log(c.dim(`  ${line}`));
  }
  return '';
}
