# Contributing

## Setup

```bash
git clone https://github.com/10xdev4u-alt/dbh.git
cd dbh
npm install
```

## Development

```bash
# Run tests
node --test

# Run with a specific test
node --test --test-name-pattern="config"

# Run CLI locally
node bin/dbh --help

# Watch mode
node --watch --test
```

## Commits

Use conventional commits:

```
feat: add new command
fix: handle edge case in parser
docs: update README with examples
test: add unit tests for config module
chore: update dependencies
style: format code with prettier
```

Keep commits small and atomic. One logical change per commit.

## Project Structure

```
src/
  main.js           CLI entry point
  commands/         One file per command
  lib/              Shared libraries
  ui/               Output formatting
  repl/             Interactive mode
test/               Test files
```

## Adding a Command

1. Create `src/commands/<name>.js` with a `handler` export
2. Wire it up in `src/main.js`
3. Add tests in `test/<name>.test.js`
4. Document in README

## Before submitting

```bash
node --test
node bin/dbh --help
```
