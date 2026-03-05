# @polterware/polterbase

[![npm version](https://img.shields.io/npm/v/%40polterware%2Fpolterbase.svg)](https://www.npmjs.com/package/@polterware/polterbase)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

An optimized interactive CLI for managing Supabase CLI workflows with more speed, consistency, and discoverability.

Polterbase is a productivity layer on top of the official `supabase` CLI. Instead of memorizing command trees, you browse one unified board, add extra args interactively, attach global flags, and pin common workflows for one-click reuse.

## Features

- **Interactive Command Builder**: Guided flow for command + subcommand + extra args
- **Suggested Subcommand Picker**: Select common args (for example `db pull`) from boxed sections before typing custom args
- **Unified Command Board**: Pinned runs, pinned commands, grouped categories, and actions in boxed sections on one screen
- **Global Flags Picker**: Add common global flags in one step
- **Pinned Commands and Runs**: Toggle base command pins with `→` and pin exact runs after success
- **Custom Command Mode**: Run raw Supabase arguments like `-v` or `status -o json`
- **Shell Execution**: Executes your local `supabase` binary directly
- **TypeScript-based CLI**: Strongly typed internal implementation

---

## Installation

### Run without installing globally

```bash
npx @polterware/polterbase
```

### Install globally

```bash
npm install -g @polterware/polterbase
```

Then run:

```bash
polterbase
```

`polterbase` is a global CLI tool. Do not add it to `dependencies` or `devDependencies` of app projects.

### Update

If you run Polterbase with `npx`, always use the latest published version explicitly:

```bash
npx @polterware/polterbase@latest
```

If you installed it globally, update it with:

```bash
npm install -g @polterware/polterbase@latest
```

---

## Requirements

- **Node.js**: `>= 18`
- **Supabase CLI**: installed and available in `PATH`

Check your environment:

```bash
node -v
supabase --version
```

Install Supabase CLI (official docs):

- [Supabase CLI Guide](https://supabase.com/docs/guides/cli)

---

## Quick Reference

### Execution Model

Polterbase always executes commands as:

```bash
supabase <command> <extra-args> <global-flags>
```

### Typical Flow

1. Choose a command from the unified board
2. Optionally pin/unpin with `→`
3. Choose suggested args or type custom extra args
4. Pick optional global flags
5. Confirm and execute

---

## Command Categories

### Quick Start

- `bootstrap` - Bootstrap a Supabase project from a starter template

### Local Development

- `db` - Manage Postgres databases
- `gen` - Run code generation tools
- `init` - Initialize a local project
- `inspect` - Inspect Supabase project resources
- `link` - Link local project to remote Supabase project
- `login` - Authenticate with Supabase access token
- `logout` - Remove local auth token
- `migration` - Manage migration scripts
- `seed` - Seed project from `supabase/config.toml`
- `services` - Show local service versions
- `start` - Start local Supabase containers
- `status` - Show local container status
- `stop` - Stop local Supabase containers
- `test` - Run tests against local stack
- `unlink` - Unlink local project

### Management APIs

- `backups`
- `branches`
- `config`
- `domains`
- `encryption`
- `functions`
- `network-bans`
- `network-restrictions`
- `orgs`
- `postgres-config`
- `projects`
- `secrets`
- `snippets`
- `ssl-enforcement`
- `sso`
- `storage`
- `vanity-subdomains`

### Additional Commands

- `completion` - Generate shell completion script
- `help` - Show Supabase command help

### Custom Command / Check Version

Use this mode for free-form args like:

- `-v`
- `status -o json`
- `db pull`
- `projects list`

---

## Global Flags

Available global flags in the interactive selector:

- `--create-ticket` - Create support ticket on error
- `--debug` - Enable debug logs
- `--experimental` - Enable experimental features
- `--yes` - Auto-confirm prompts

---

## Pinned Commands

Polterbase supports two pinned sections at the top of the main menu:

- `Pinned Runs` for exact commands like `db pull --debug`
- `Pinned Commands` for base commands like `db` or `start`

The main menu and the suggested-args screen group related options into boxed sections so pinned items, command groups, and actions stay visually separated.

Use `→` on a selected base command to pin or unpin it.
Use `→` on the suggested subcommand screen to pin exact runs like `db pull` before executing.
After a successful execution, Polterbase can also pin that exact command into `Pinned Runs`.

Pins are persisted locally using OS-level app config storage.

---

## Usage Examples

### Check Supabase CLI version

Interactive path:

1. `Custom Command / Check Version`
2. Input: `-v`

Executed command:

```bash
supabase -v
```

### Start local stack with debug

Interactive path:

1. `Local Development`
2. Command: `start`
3. Extra args: none
4. Flags: `--debug`

Executed command:

```bash
supabase start --debug
```

### List projects

Interactive path:

1. `Management APIs`
2. Command: `projects`
3. Extra args: `list`

Executed command:

```bash
supabase projects list
```

### Run DB pull and auto-confirm prompts

Interactive path:

1. `Local Development`
2. Command: `db`
3. Extra args: `pull`
4. Flags: `--yes`

Executed command:

```bash
supabase db pull --yes
```

---

## Troubleshooting

### `supabase: command not found`

Supabase CLI is not installed or not in your `PATH`.

Fix:

1. Install Supabase CLI
2. Restart terminal
3. Run `supabase --version`

### Command exits with non-zero code

Polterbase forwards execution to Supabase CLI. Use `--debug` and re-run to inspect detailed logs.

### Pinned commands are missing

Pins are managed directly in the board. Select a base command and press `→` to pin it, or pin an exact run after a successful execution.

### Interactive prompt did not open correctly

Ensure you are running in a terminal that supports interactive TTY prompts.

---

## Security Notes

- Polterbase executes local shell commands through your installed Supabase CLI.
- Keep Supabase tokens out of shared shells and CI logs.
- Prefer short-lived tokens and least-privileged project access.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes with clear messages
4. Open a pull request

Repository:

- [polterware/polterbase](https://github.com/polterware/polterbase)

---

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Author

[Polterware](https://www.polterware.com)
