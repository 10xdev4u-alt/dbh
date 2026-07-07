import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

const DBH_DIR = resolve(homedir(), '.dbh');
if (!existsSync(DBH_DIR)) mkdirSync(DBH_DIR, { recursive: true });

const HISTORY_FILE = resolve(DBH_DIR, 'history');
const MAX_LINES = 1000;

export function loadHistory() {
  try {
    if (existsSync(HISTORY_FILE)) {
      const text = readFileSync(HISTORY_FILE, 'utf8');
      const lines = text.trim().split('\n').filter(Boolean);
      return lines.slice(-MAX_LINES);
    }
  } catch {}
  return [];
}

export function appendHistory(cmd) {
  try {
    appendFileSync(HISTORY_FILE, cmd + '\n', 'utf8');
  } catch {}
}

export function getHistoryFile() {
  return HISTORY_FILE;
}

export function clearHistory() {
  try {
    writeFileSync(HISTORY_FILE, '', 'utf8');
  } catch {}
}
