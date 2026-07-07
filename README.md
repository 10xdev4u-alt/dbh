# dbh — DeepBridge Harness

A Codebuff-style interactive CLI for managing [DeepBridge](https://github.com/10xdev4u-alt/deepbridge) proxy deployments.

## Quickstart

```bash
# Install globally
npm install -g .

# Interactive REPL (Codebuff-style)
dbh

# Or use commands
dbh status       # Show proxy status
dbh url          # Get tunnel URL
dbh logs -f      # Follow logs
```

## Setup wizard

```bash
dbh init
```

Walks you through accounts, API keys, Discord bot, and port config — then starts the proxy.

## Commands

| Command | Description |
|---------|-------------|
| `dbh` | Interactive REPL mode |
| `dbh init` | Setup wizard |
| `dbh up` | Start proxy |
| `dbh down` | Stop proxy |
| `dbh logs [-f]` | View logs |
| `dbh status` | Status dashboard |
| `dbh restart` | Restart proxy |
| `dbh url` | Get tunnel URL |
| `dbh health` | Health check |
| `dbh doctor` | Diagnostics |
| `dbh backup` | Backup data + config |
| `dbh update` | Pull latest + restart |
| `dbh account list` | List accounts |
| `dbh account add` | Add account |
| `dbh account rm <email>` | Remove account |
| `dbh key list` | List API keys |
| `dbh key add` | Add API key |
| `dbh key rm <key>` | Remove key |
| `dbh config show` | Show config |
| `dbh config set <key> <value>` | Set config value |
| `dbh config edit` | Edit .env |

## REPL Mode

Running `dbh` with no arguments starts a Codebuff-style interactive shell:

```
dbh › status          # Show live status
dbh › accounts        # List accounts
dbh › url             # Get tunnel URL
dbh › .help           # Show commands
dbh › .clear          # Clear screen
dbh › .watch          # Auto-refresh status every 5s
dbh › .exit           # Exit
```

## Requirements

- Node.js 18+
- Docker + Docker Compose (for managing the proxy)
- A running DeepBridge instance (local or remote)

## Color Palette

Coffee theme matching DeepBridge:

```
Background  ████████  #000000
Surface      ████████  #1F150C
Border       ████████  #412D15
Accent       ████████  #E1DCC9
Green        ████████  #B8C99D
Red          ████████  #C97B5C
Yellow       ████████  #D4B886
```

## License

MIT
