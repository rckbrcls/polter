#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import crypto from "node:crypto";

import {
  allCommands,
  getCommandById,
  getCommandsByTool,
  resolveToolCommand,
  runCommand,
  getToolInfo,
  getCurrentStatus,
  getAllPipelines,
  findPipelineByName,
  savePipeline,
  deletePipeline,
  executePipeline,
  parsePolterYaml,
  planChanges,
  applyActions,
  detectPkgManager,
  resolvePkgArgs,
  translateCommand,
  startProcess,
  stopProcess,
  listProcesses,
  getProcessOutput,
  generateProcessId,
  findProcessesByCwd,
  findRunningByCommand,
  type CliToolId,
  type PipelineStep,
} from "./api.js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const TOOL_IDS: CliToolId[] = ["supabase", "gh", "vercel", "git", "pkg"];

const server = new McpServer({
  name: "polter",
  version: "0.1.0",
});

// --- polter_list_commands ---
server.tool(
  "polter_list_commands",
  "List available CLI commands across Supabase, GitHub, Vercel, and Git. Optionally filter by tool.",
  { tool: z.enum(["supabase", "gh", "vercel", "git", "pkg"]).optional() },
  async ({ tool }) => {
    const commands = tool ? getCommandsByTool(tool) : allCommands;
    const result = commands.map((cmd) => ({
      id: cmd.id,
      tool: cmd.tool,
      label: cmd.label,
      hint: cmd.hint ?? null,
      suggestedArgs: cmd.suggestedArgs?.map((a) => ({
        value: a.value,
        label: a.label,
        hint: a.hint ?? null,
        args: a.args,
      })) ?? [],
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// --- polter_run_command ---
server.tool(
  "polter_run_command",
  "Execute a CLI command by its Polter ID (e.g. 'gh:pr:create', 'vercel:deploy', 'git:commit'). Use polter_list_commands to discover available IDs.",
  {
    commandId: z.string(),
    args: z.array(z.string()).optional(),
    flags: z.array(z.string()).optional(),
  },
  async ({ commandId, args, flags }) => {
    const cmdDef = getCommandById(commandId);
    if (!cmdDef) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: `Command not found: ${commandId}` }) }],
        isError: true,
      };
    }

    const cwd = process.cwd();
    const resolved = resolveToolCommand(cmdDef.tool, cwd);
    let baseArgs: string[];
    if (cmdDef.tool === "pkg") {
      try {
        const translated = resolvePkgArgs(cmdDef.base, cwd);
        baseArgs = translated.args;
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: (err as Error).message }) }],
          isError: true,
        };
      }
    } else {
      baseArgs = cmdDef.base;
    }
    const allArgs = [...baseArgs, ...(args ?? []), ...(flags ?? [])];
    const result = await runCommand(
      { command: resolved.command, env: resolved.env },
      allArgs,
      cwd,
      { quiet: true },
    ).promise;

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          success: !result.spawnError && result.exitCode === 0,
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
        }, null, 2),
      }],
    };
  },
);

// --- polter_status ---
server.tool(
  "polter_status",
  "Get the current status of all CLI tools (installed, versions) and project linkage (Supabase, Vercel, GitHub).",
  {},
  async () => {
    const tools = TOOL_IDS.map((id) => getToolInfo(id));
    const project = getCurrentStatus();
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ tools, project }, null, 2) }],
    };
  },
);

// --- polter_list_pipelines ---
server.tool(
  "polter_list_pipelines",
  "List all saved pipelines (multi-step command sequences) from both project and global scope.",
  {},
  async () => {
    const pipelines = getAllPipelines();
    return {
      content: [{ type: "text" as const, text: JSON.stringify(pipelines, null, 2) }],
    };
  },
);

// --- polter_run_pipeline ---
server.tool(
  "polter_run_pipeline",
  "Execute a saved pipeline by name. Returns results for each step.",
  { name: z.string() },
  async ({ name }) => {
    const pipeline = findPipelineByName(name);
    if (!pipeline) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: `Pipeline not found: ${name}` }) }],
        isError: true,
      };
    }

    const results = await executePipeline(pipeline, () => {}, process.cwd());
    const success = results.every((r) => r.status === "success" || r.status === "skipped");
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          success,
          steps: results.map((r) => ({
            label: r.step.label ?? r.step.commandId,
            status: r.status,
            stdout: r.result?.stdout ?? "",
            stderr: r.result?.stderr ?? "",
          })),
        }, null, 2),
      }],
    };
  },
);

// --- polter_create_pipeline ---
server.tool(
  "polter_create_pipeline",
  "Create a new pipeline (multi-step command sequence). Use polter_list_commands to discover valid command IDs for steps.",
  {
    name: z.string().describe("Pipeline name"),
    description: z.string().optional().describe("Pipeline description"),
    source: z.enum(["project", "global"]).default("project").describe("Where to save the pipeline"),
    steps: z.array(z.object({
      commandId: z.string().describe("Command ID (e.g. 'git:commit', 'vercel:deploy:prod')"),
      args: z.array(z.string()).default([]).describe("Command arguments"),
      flags: z.array(z.string()).default([]).describe("Command flags"),
      continueOnError: z.boolean().default(false).describe("Continue pipeline if this step fails"),
      label: z.string().optional().describe("Human-readable step label"),
    })).min(1).describe("Pipeline steps"),
  },
  async ({ name, description, source, steps }) => {
    // Check for duplicate name
    const existing = findPipelineByName(name);
    if (existing) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: `Pipeline already exists: ${name}. Use polter_update_pipeline to modify it.` }) }],
        isError: true,
      };
    }

    // Validate all command IDs
    const invalidIds = steps.filter((s) => !getCommandById(s.commandId)).map((s) => s.commandId);
    if (invalidIds.length > 0) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: `Unknown command IDs: ${invalidIds.join(", ")}` }) }],
        isError: true,
      };
    }

    const now = new Date().toISOString();
    const pipeline = {
      id: crypto.randomUUID(),
      name,
      description,
      steps: steps.map((s): PipelineStep => ({
        id: crypto.randomUUID(),
        commandId: s.commandId,
        args: s.args,
        flags: s.flags,
        continueOnError: s.continueOnError,
        label: s.label,
      })),
      createdAt: now,
      updatedAt: now,
    };

    savePipeline(pipeline, source);

    return {
      content: [{ type: "text" as const, text: JSON.stringify({ success: true, pipeline }, null, 2) }],
    };
  },
);

// --- polter_update_pipeline ---
server.tool(
  "polter_update_pipeline",
  "Update an existing pipeline by name. You can change its description and/or steps.",
  {
    name: z.string().describe("Pipeline name to update"),
    description: z.string().optional().describe("New description"),
    steps: z.array(z.object({
      commandId: z.string(),
      args: z.array(z.string()).default([]),
      flags: z.array(z.string()).default([]),
      continueOnError: z.boolean().default(false),
      label: z.string().optional(),
    })).optional().describe("New steps (replaces all existing steps)"),
  },
  async ({ name, description, steps }) => {
    const existing = findPipelineByName(name);
    if (!existing) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: `Pipeline not found: ${name}` }) }],
        isError: true,
      };
    }

    if (steps) {
      const invalidIds = steps.filter((s) => !getCommandById(s.commandId)).map((s) => s.commandId);
      if (invalidIds.length > 0) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: `Unknown command IDs: ${invalidIds.join(", ")}` }) }],
          isError: true,
        };
      }
    }

    const updated = {
      ...existing,
      description: description ?? existing.description,
      steps: steps
        ? steps.map((s): PipelineStep => ({
            id: crypto.randomUUID(),
            commandId: s.commandId,
            args: s.args,
            flags: s.flags,
            continueOnError: s.continueOnError,
            label: s.label,
          }))
        : existing.steps,
      updatedAt: new Date().toISOString(),
    };

    savePipeline(updated, existing.source);

    return {
      content: [{ type: "text" as const, text: JSON.stringify({ success: true, pipeline: updated }, null, 2) }],
    };
  },
);

// --- polter_delete_pipeline ---
server.tool(
  "polter_delete_pipeline",
  "Delete a saved pipeline by name.",
  { name: z.string().describe("Pipeline name to delete") },
  async ({ name }) => {
    const existing = findPipelineByName(name);
    if (!existing) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: `Pipeline not found: ${name}` }) }],
        isError: true,
      };
    }

    deletePipeline(existing.id, existing.source);

    return {
      content: [{ type: "text" as const, text: JSON.stringify({ success: true, deleted: name }) }],
    };
  },
);

// --- polter_plan ---
server.tool(
  "polter_plan",
  "Parse polter.yaml and compute the diff between desired state and current state. Shows what actions would be taken without executing them.",
  {},
  async () => {
    const yaml = parsePolterYaml();
    if (!yaml) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: "No polter.yaml found in project" }) }],
        isError: true,
      };
    }

    const plan = planChanges(yaml);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(plan, null, 2) }],
    };
  },
);

// --- polter_apply ---
server.tool(
  "polter_apply",
  "Parse polter.yaml, compute the plan, and apply all actions to converge to the desired state. This executes real CLI commands.",
  {},
  async () => {
    const yaml = parsePolterYaml();
    if (!yaml) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: "No polter.yaml found in project" }) }],
        isError: true,
      };
    }

    const plan = planChanges(yaml);
    if (plan.noChanges) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ noChanges: true, results: [] }) }],
      };
    }

    const results = await applyActions(plan.actions);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          noChanges: false,
          results: results.map((r) => ({
            action: r.action.description,
            tool: r.action.tool,
            success: r.success,
            stdout: r.result.stdout,
            stderr: r.result.stderr,
          })),
        }, null, 2),
      }],
    };
  },
);

// --- Package Manager MCP Tools ---

function pkgRunHelper(base: string[], extraArgs: string[] = []) {
  const cwd = process.cwd();
  const translated = resolvePkgArgs(base, cwd);
  const resolved = resolveToolCommand("pkg", cwd);
  return runCommand(
    { command: resolved.command, env: resolved.env },
    [...translated.args, ...extraArgs],
    cwd,
    { quiet: true },
  ).promise;
}

server.tool(
  "polter_run_script_bg",
  "Start a package.json script as a tracked background process using the detected package manager (npm/pnpm/yarn/bun). The process output is captured and can be read with polter_logs. Use polter_ps to check status.",
  {
    script: z.string().describe("Script name from package.json (e.g. 'dev', 'build', 'test')"),
    args: z.array(z.string()).optional().describe("Extra arguments to pass to the script"),
    cwd: z.string().optional().describe("Working directory. Defaults to current directory."),
  },
  async ({ script, args: extraArgs, cwd: cwdArg }) => {
    const cwd = cwdArg ?? process.cwd();
    const pkgPath = join(cwd, "package.json");

    if (!existsSync(pkgPath)) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: "No package.json found in " + cwd }) }],
        isError: true,
      };
    }

    const raw = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const scripts: Record<string, string> = raw.scripts ?? {};
    if (!scripts[script]) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: `Script "${script}" not found. Available: ${Object.keys(scripts).join(", ")}` }) }],
        isError: true,
      };
    }

    const mgr = detectPkgManager(cwd);
    try {
      const translated = translateCommand(["run", script, ...(extraArgs ?? [])], mgr.id);
      const existing = findRunningByCommand(cwd, mgr.command, translated.args);
      if (existing) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              alreadyRunning: true,
              process: existing,
              output: getProcessOutput(existing.id, 20),
            }, null, 2),
          }],
        };
      }

      const id = generateProcessId(mgr.command, translated.args);
      const info = startProcess(id, mgr.command, translated.args, cwd);
      await new Promise((r) => setTimeout(r, 500));

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            process: info,
            output: getProcessOutput(id, 20),
            packageManager: mgr.id,
          }, null, 2),
        }],
      };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: (err as Error).message }) }],
        isError: true,
      };
    }
  },
);

server.tool(
  "polter_pkg_build",
  "Run the build script from package.json using the detected package manager (npm/pnpm/yarn/bun).",
  {},
  async () => {
    const result = await pkgRunHelper(["run", "build"]);
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ success: result.exitCode === 0, stdout: result.stdout, stderr: result.stderr }, null, 2) }],
    };
  },
);

server.tool(
  "polter_pkg_publish",
  "Publish the package to the registry using the detected package manager (npm/pnpm/yarn/bun).",
  {
    tag: z.string().optional().describe("Dist-tag (e.g. 'next', 'beta')"),
    dryRun: z.boolean().optional().describe("Simulate publish without uploading"),
  },
  async ({ tag, dryRun }) => {
    const extra: string[] = [];
    if (tag) extra.push("--tag", tag);
    if (dryRun) extra.push("--dry-run");
    try {
      const result = await pkgRunHelper(["publish"], extra);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ success: result.exitCode === 0, stdout: result.stdout, stderr: result.stderr }, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: (err as Error).message }) }],
        isError: true,
      };
    }
  },
);

server.tool(
  "polter_pkg_install",
  "Install dependencies using the detected package manager (npm/pnpm/yarn/bun). Optionally install specific packages.",
  {
    packages: z.array(z.string()).optional().describe("Specific packages to install"),
    dev: z.boolean().optional().describe("Install as dev dependency"),
  },
  async ({ packages, dev }) => {
    const base = packages && packages.length > 0 ? ["add"] : ["install"];
    const extra: string[] = [...(packages ?? [])];
    if (dev) extra.push("--save-dev");
    const result = await pkgRunHelper(base, extra);
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ success: result.exitCode === 0, stdout: result.stdout, stderr: result.stderr }, null, 2) }],
    };
  },
);

server.tool(
  "polter_pkg_run_script",
  "Run a script defined in package.json using the detected package manager (npm/pnpm/yarn/bun).",
  {
    script: z.string().describe("Script name to run"),
    args: z.array(z.string()).optional().describe("Extra arguments"),
  },
  async ({ script, args }) => {
    const result = await pkgRunHelper(["run", script], args ?? []);
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ success: result.exitCode === 0, stdout: result.stdout, stderr: result.stderr }, null, 2) }],
    };
  },
);

server.tool(
  "polter_pkg_version_bump",
  "Bump the package version (semver) using the detected package manager (npm/pnpm/yarn/bun).",
  {
    type: z.enum(["patch", "minor", "major"]).describe("Version bump type"),
  },
  async ({ type }) => {
    const result = await pkgRunHelper(["version", type]);
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ success: result.exitCode === 0, stdout: result.stdout, stderr: result.stderr }, null, 2) }],
    };
  },
);

server.tool(
  "polter_pkg_audit",
  "Run a security audit on dependencies using the detected package manager (npm/pnpm/yarn/bun).",
  {
    fix: z.boolean().optional().describe("Attempt to fix vulnerabilities"),
  },
  async ({ fix }) => {
    try {
      const extra = fix ? ["--fix"] : [];
      const result = await pkgRunHelper(["audit"], extra);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ success: result.exitCode === 0, stdout: result.stdout, stderr: result.stderr }, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: (err as Error).message }) }],
        isError: true,
      };
    }
  },
);

server.tool(
  "polter_pkg_info",
  "Get information about a package from the registry using the detected package manager (npm/pnpm/yarn/bun).",
  {
    package: z.string().describe("Package name to look up"),
  },
  async ({ package: pkg }) => {
    try {
      const result = await pkgRunHelper(["info", pkg]);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ success: result.exitCode === 0, stdout: result.stdout, stderr: result.stderr }, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: (err as Error).message }) }],
        isError: true,
      };
    }
  },
);

// --- Process Manager MCP Tools ---

server.tool(
  "polter_ps",
  "List all tracked background processes with their status, PID, uptime, and exit info.",
  {},
  async () => {
    const processes = listProcesses();
    return {
      content: [{ type: "text" as const, text: JSON.stringify(processes, null, 2) }],
    };
  },
);

server.tool(
  "polter_start",
  "Start a command as a tracked background process. Useful for long-running tasks like dev servers. Output is captured and can be read with polter_logs.",
  {
    command: z.string().describe("Command to run (e.g. 'npm')"),
    args: z.array(z.string()).optional().describe("Command arguments (e.g. ['run', 'dev'])"),
    id: z.string().optional().describe("Human-readable process ID. Auto-generated if omitted."),
    cwd: z.string().optional().describe("Working directory. Defaults to current directory."),
  },
  async ({ command, args, id, cwd }) => {
    const processArgs = args ?? [];
    const processId = id ?? generateProcessId(command, processArgs);
    const processCwd = cwd ?? process.cwd();

    try {
      const info = startProcess(processId, command, processArgs, processCwd);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ success: true, process: info }, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: (err as Error).message }) }],
        isError: true,
      };
    }
  },
);

server.tool(
  "polter_logs",
  "Read captured stdout/stderr from a tracked background process.",
  {
    id: z.string().describe("Process ID"),
    tail: z.number().optional().describe("Number of lines to return from the end (default: all)"),
    stream: z.enum(["stdout", "stderr", "both"]).optional().describe("Which output stream to read (default: both)"),
  },
  async ({ id, tail, stream }) => {
    try {
      const output = getProcessOutput(id, tail, stream);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: (err as Error).message }) }],
        isError: true,
      };
    }
  },
);

server.tool(
  "polter_stop",
  "Stop a tracked background process. Sends SIGTERM, escalates to SIGKILL after 5 seconds.",
  {
    id: z.string().describe("Process ID to stop"),
  },
  async ({ id }) => {
    try {
      const info = await stopProcess(id);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ success: true, process: info }, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: (err as Error).message }) }],
        isError: true,
      };
    }
  },
);

// --- polter_smart_start ---
server.tool(
  "polter_smart_start",
  "Smart process starter: reads package.json, auto-detects package manager, starts a script as a background process. If script is omitted, lists available scripts. If already running, returns current info and recent logs instead of duplicating.",
  {
    script: z.string().optional().describe("Script name from package.json (e.g. 'dev', 'build')"),
    cwd: z.string().optional().describe("Repository directory. Defaults to current directory."),
    tail: z.number().optional().default(20).describe("Number of initial log lines to return"),
  },
  async ({ script, cwd: cwdArg, tail }) => {
    const cwd = cwdArg ?? process.cwd();
    const pkgPath = join(cwd, "package.json");

    if (!existsSync(pkgPath)) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: "No package.json found in " + cwd }) }],
        isError: true,
      };
    }

    const raw = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const scripts: Record<string, string> = raw.scripts ?? {};

    if (!script) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ scripts: Object.keys(scripts) }, null, 2) }],
      };
    }

    if (!scripts[script]) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: `Script "${script}" not found. Available: ${Object.keys(scripts).join(", ")}` }) }],
        isError: true,
      };
    }

    const mgr = detectPkgManager(cwd);
    const runArgs = ["run", script];

    const existing = findRunningByCommand(cwd, mgr.command, runArgs);
    if (existing) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            alreadyRunning: true,
            process: existing,
            output: getProcessOutput(existing.id, tail),
          }, null, 2),
        }],
      };
    }

    try {
      const id = generateProcessId(mgr.command, runArgs);
      const info = startProcess(id, mgr.command, runArgs, cwd);
      await new Promise((r) => setTimeout(r, 500));
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            alreadyRunning: false,
            process: info,
            output: getProcessOutput(id, tail),
            packageManager: mgr.id,
          }, null, 2),
        }],
      };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: (err as Error).message }) }],
        isError: true,
      };
    }
  },
);

// --- polter_find_process ---
server.tool(
  "polter_find_process",
  "Find all tracked processes for a repository directory. Returns process info with recent logs embedded. No need to know process IDs — just point to the repo.",
  {
    cwd: z.string().optional().describe("Repository directory. Defaults to current directory."),
    filter: z.string().optional().describe("Filter by substring in command+args"),
    tail: z.number().optional().default(20).describe("Number of log lines per process"),
  },
  async ({ cwd: cwdArg, filter, tail }) => {
    const cwd = cwdArg ?? process.cwd();
    let processes = findProcessesByCwd(cwd);

    if (filter) {
      const f = filter.toLowerCase();
      processes = processes.filter((proc) =>
        (proc.command + " " + proc.args.join(" ")).toLowerCase().includes(f),
      );
    }

    const result = processes.map((proc) => ({
      process: proc,
      output: getProcessOutput(proc.id, tail),
    }));

    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// --- MCP Resources ---

server.resource(
  "package-json",
  "polter://package-json",
  { description: "Parsed package.json (name, version, dependencies, scripts)" },
  async () => {
    const cwd = process.cwd();
    const pkgPath = join(cwd, "package.json");
    if (!existsSync(pkgPath)) {
      return { contents: [{ uri: "polter://package-json", text: JSON.stringify({ error: "No package.json found" }) }] };
    }
    const raw = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const summary = {
      name: raw.name,
      version: raw.version,
      description: raw.description,
      dependencies: raw.dependencies,
      devDependencies: raw.devDependencies,
      scripts: raw.scripts,
    };
    return { contents: [{ uri: "polter://package-json", text: JSON.stringify(summary, null, 2) }] };
  },
);

server.resource(
  "dependency-tree",
  "polter://dependency-tree",
  { description: "Installed dependency tree (npm ls --json or equivalent)" },
  async () => {
    const cwd = process.cwd();
    try {
      const result = await pkgRunHelper(["ls", "--json"]);
      return { contents: [{ uri: "polter://dependency-tree", text: result.stdout }] };
    } catch {
      return { contents: [{ uri: "polter://dependency-tree", text: JSON.stringify({ error: "Could not list dependencies" }) }] };
    }
  },
);

server.resource(
  "scripts",
  "polter://scripts",
  { description: "Scripts defined in package.json" },
  async () => {
    const cwd = process.cwd();
    const pkgPath = join(cwd, "package.json");
    if (!existsSync(pkgPath)) {
      return { contents: [{ uri: "polter://scripts", text: JSON.stringify({ error: "No package.json found" }) }] };
    }
    const raw = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return { contents: [{ uri: "polter://scripts", text: JSON.stringify(raw.scripts ?? {}, null, 2) }] };
  },
);

server.resource(
  "pkg-manager",
  "polter://pkg-manager",
  { description: "Detected package manager info (id, version, lockFile)" },
  async () => {
    const cwd = process.cwd();
    const mgr = detectPkgManager(cwd);
    const resolved = resolveToolCommand("pkg", cwd);
    let version: string | undefined;
    if (resolved.source !== "not-found") {
      try {
        const result = await runCommand(
          { command: resolved.command, env: resolved.env },
          ["--version"],
          cwd,
          { quiet: true },
        ).promise;
        version = result.stdout.trim().split("\n")[0];
      } catch { /* ignore */ }
    }
    return {
      contents: [{
        uri: "polter://pkg-manager",
        text: JSON.stringify({ id: mgr.id, command: mgr.command, lockFile: mgr.lockFile, version }, null, 2),
      }],
    };
  },
);

// --- MCP Prompts ---

server.prompt(
  "polter_publish_workflow",
  "Step-by-step guide for publishing a package: version bump, build, test, publish, git tag.",
  {},
  async () => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: `Guide me through a complete publish workflow for this project:

1. **Version bump** - Choose patch/minor/major based on changes since last release
2. **Build** - Run the build script to ensure dist is up to date
3. **Test** - Run the test suite to verify everything passes
4. **Publish** - Publish to npm registry (consider --dry-run first)
5. **Git tag** - Create and push a git tag for the release

Use polter tools to execute each step. Check package.json for current version and scripts first.`,
      },
    }],
  }),
);

server.prompt(
  "polter_version_strategy",
  "Suggest a semver versioning strategy based on current version and change type.",
  {
    currentVersion: z.string().describe("Current package version"),
    changeType: z.string().describe("Type of change: feature, fix, breaking, docs, etc."),
  },
  async ({ currentVersion, changeType }) => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: `Current version: ${currentVersion}
Change type: ${changeType}

Based on semver rules:
- PATCH (x.y.Z): backwards-compatible bug fixes
- MINOR (x.Y.z): backwards-compatible new features
- MAJOR (X.y.z): breaking changes

Recommend the appropriate version bump and explain the reasoning. If pre-1.0, note that minor can include breaking changes by convention.`,
      },
    }],
  }),
);

server.prompt(
  "polter_audit_resolution",
  "Guide for analyzing and resolving npm audit findings.",
  {},
  async () => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: `Run a security audit on this project and help me resolve any findings:

1. **Run audit** - Use polter_pkg_audit to check for vulnerabilities
2. **Analyze results** - Categorize by severity (critical, high, moderate, low)
3. **Resolution strategy** for each finding:
   - Direct dependency: update to patched version
   - Transitive dependency: check if parent has update
   - No fix available: evaluate risk and consider alternatives
4. **Apply fixes** - Use polter_pkg_install to update packages
5. **Verify** - Re-run audit to confirm fixes

Start by running the audit.`,
      },
    }],
  }),
);

// --- Start server ---
const transport = new StdioServerTransport();
await server.connect(transport);
