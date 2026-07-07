export function printJson(data, opts = {}) {
  const output = JSON.stringify(data, null, opts.pretty !== false ? 2 : undefined);
  console.log(output);
}

export function isJsonMode() {
  return process.argv.includes('--json') || process.env.DBH_OUTPUT === 'json';
}
