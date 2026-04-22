import { readFileSync, writeFileSync, mkdirSync, existsSync } from "./fs.js";
import { join } from "node:path";
import { homedir } from "node:os";
import pc from "picocolors";

const SKILL_DIR = join(homedir(), ".claude", "skills", "polter");
const SKILL_PATH = join(SKILL_DIR, "SKILL.md");

const SKILL_CONTENT = `---
name: polter
description: "Polter - Infrastructure Orchestrator. Use when developing in any project to: monitor dev processes and check logs for errors after code changes, manage pipelines (multi-step command sequences), run CLI commands (Supabase, GitHub, Vercel, Git), manage packages (install, build, publish, audit), and apply declarative infrastructure from polter.yaml."
---

# Polter Skill

You have access to Polter MCP tools for infrastructure orchestration. Use them proactively during development.

## Process Monitoring

**Tools:** \`polter_ps\`, \`polter_logs\`, \`polter_start\`, \`polter_stop\`, \`polter_find_process\`, \`polter_smart_start\`, \`polter_run_script_bg\`

- At the start of a session, run \`polter_ps\` to check for active dev processes
- After significant code edits, check \`polter_logs\` for compilation or runtime errors
- Use \`polter_find_process\` to find processes running in the current directory
- Use \`polter_smart_start\` to start package.json scripts as background processes (e.g. dev servers)
- Use \`polter_run_script_bg\` to run arbitrary scripts in the background
- Use \`polter_stop\` to stop processes that are no longer needed

## CLI Commands

**Tools:** \`polter_list_commands\`, \`polter_run_command\`, \`polter_status\`

- Execute commands for Supabase, GitHub CLI, Vercel, and Git via their command IDs
- Use \`polter_list_commands\` to discover available commands, optionally filtered by tool
- Use \`polter_run_command\` to execute a command by its ID with additional args/flags
- Check \`polter_status\` to see which CLI tools are installed and their versions

## Pipelines

**Tools:** \`polter_list_pipelines\`, \`polter_run_pipeline\`, \`polter_create_pipeline\`, \`polter_update_pipeline\`, \`polter_delete_pipeline\`

- List and run saved multi-step command sequences with \`polter_list_pipelines\` and \`polter_run_pipeline\`
- Create new pipelines for repetitive workflows (e.g. build + test + deploy) with \`polter_create_pipeline\`
- Suggest creating pipelines when you notice the user repeating the same sequence of commands

## Package Management

**Tools:** \`polter_pkg_build\`, \`polter_pkg_install\`, \`polter_pkg_publish\`, \`polter_pkg_run_script\`, \`polter_pkg_version_bump\`, \`polter_pkg_audit\`, \`polter_pkg_info\`

- Auto-detects the package manager (npm, pnpm, yarn, bun) from lockfiles
- Use \`polter_pkg_build\` for building, \`polter_pkg_install\` for installing dependencies
- Use \`polter_pkg_run_script\` to run package.json scripts
- Use \`polter_pkg_audit\` to check for vulnerabilities
- Use \`polter_pkg_version_bump\` before publishing, then \`polter_pkg_publish\`

## Declarative Infrastructure

**Tools:** \`polter_plan\`, \`polter_apply\`

- Use \`polter_plan\` to read \`polter.yaml\` and compute a diff of desired vs current state
- Use \`polter_apply\` to execute the planned infrastructure changes
- Always run \`polter_plan\` first to review changes before applying

## Workflow Recommendations

1. **Starting a session:** Run \`polter_ps\` to see what's already running
2. **After code changes:** Check \`polter_logs\` for errors in dev server output
3. **Setting up a project:** Use \`polter_status\` to verify tools, then \`polter_smart_start\` for dev server
4. **Deploying:** Create a pipeline with build + test + deploy steps
5. **Infrastructure changes:** Edit \`polter.yaml\`, run \`polter_plan\`, then \`polter_apply\`
`;

export type SkillSetupStatus = "created" | "updated" | "already-up-to-date";

export interface SkillSetupResult {
  status: SkillSetupStatus;
  path: string;
}

export function setupSkill(): SkillSetupResult {
  if (existsSync(SKILL_PATH)) {
    const existing = readFileSync(SKILL_PATH, "utf-8");
    if (existing === SKILL_CONTENT) {
      return { status: "already-up-to-date", path: SKILL_PATH };
    }
    writeFileSync(SKILL_PATH, SKILL_CONTENT, "utf-8");
    return { status: "updated", path: SKILL_PATH };
  }

  mkdirSync(SKILL_DIR, { recursive: true });
  writeFileSync(SKILL_PATH, SKILL_CONTENT, "utf-8");
  return { status: "created", path: SKILL_PATH };
}

export function setupSkillCli(): void {
  const result = setupSkill();

  switch (result.status) {
    case "created":
      process.stdout.write(pc.green(`\n  Skill installed at ${result.path}\n`));
      process.stdout.write(pc.dim("  Use /polter in Claude Code to activate.\n\n"));
      break;
    case "updated":
      process.stdout.write(pc.green(`\n  Skill updated at ${result.path}\n`));
      process.stdout.write(pc.dim("  Use /polter in Claude Code to activate.\n\n"));
      break;
    case "already-up-to-date":
      process.stdout.write(pc.cyan(`\n  Skill already up to date at ${result.path}\n\n`));
      break;
  }
}

export function getSkillContent(): string {
  return SKILL_CONTENT;
}

export function getSkillPath(): string {
  return SKILL_PATH;
}
