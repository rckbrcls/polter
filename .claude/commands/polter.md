# Polter - Infrastructure Orchestrator

Polter orchestrates CLI tools (Supabase, GitHub CLI, Vercel, and your package manager) with 139+ commands, multi-step pipelines, and declarative state management via `polter.yaml`.

## Available MCP Tools

You have access to `polter_*` tools via the Polter MCP server. Use them to manage infrastructure without memorizing CLI flags.

### Discovery

- **`polter_list_commands`** - Browse all available commands. Use `tool` param to filter by `supabase`, `gh`, `vercel`, or `pkg`. Start here when you need to find the right command.
- **`polter_status`** - Check which CLIs are installed, their versions, and whether the project is linked to Supabase/Vercel/GitHub.

### Execution

- **`polter_run_command`** - Run any command by its ID (e.g. `gh:pr:create`, `vercel:deploy`, `supabase:db:push`). Pass additional `args` and `flags` as arrays.
- **`polter_run_pipeline`** - Execute a saved multi-step pipeline by name. Pipelines chain multiple commands together.

### Pipelines

- **`polter_list_pipelines`** - List all saved pipelines (project-scoped and global).

### Declarative State (polter.yaml)

- **`polter_plan`** - Show what changes would be applied to match the desired state in `polter.yaml`. Like `terraform plan`.
- **`polter_apply`** - Apply all planned changes. Like `terraform apply`.

## Common Workflows

### Deploy to production
1. `polter_run_command` with `vercel:deploy:prod`

### Create a pull request
1. `polter_run_command` with `gh:pr:create` and args like `["--title", "feat: add login", "--body", "..."]`

### Preview infrastructure changes
1. `polter_plan` to see what would change
2. `polter_apply` to execute (after user confirmation)

### Check project status
1. `polter_status` to see tool versions and project linkage

### Run database migrations
1. `polter_run_command` with `supabase:db:push`

### Run a saved pipeline
1. `polter_list_pipelines` to find available pipelines
2. `polter_run_pipeline` with the pipeline name

## Command ID Format

Command IDs follow the pattern `tool:subcommand:action`, e.g.:
- `supabase:db:push`, `supabase:functions:deploy`
- `gh:pr:create`, `gh:issue:list`
- `vercel:deploy`, `vercel:env:add`
- `pkg:build`, `pkg:install`

Use `polter_list_commands` to discover exact IDs and their accepted arguments.

## Tips

- Always use `polter_list_commands` first if you're unsure about the exact command ID or available arguments.
- Use `polter_status` to verify tools are installed before running commands.
- For multi-step workflows, check if a pipeline already exists with `polter_list_pipelines` before running commands individually.
- `polter_plan` is safe and read-only. Always run it before `polter_apply` so the user can review changes.
- Command args mirror the underlying CLI flags (e.g. `["--project-ref", "abc123"]` for Supabase).
