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
  type CliToolId,
  type PipelineStep,
} from "./api.js";

const TOOL_IDS: CliToolId[] = ["supabase", "gh", "vercel", "git"];

const server = new McpServer({
  name: "polter",
  version: "0.1.0",
});

// --- polter_list_commands ---
server.tool(
  "polter_list_commands",
  "List available CLI commands across Supabase, GitHub, Vercel, and Git. Optionally filter by tool.",
  { tool: z.enum(["supabase", "gh", "vercel", "git"]).optional() },
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

    const resolved = resolveToolCommand(cmdDef.tool);
    const allArgs = [...cmdDef.base, ...(args ?? []), ...(flags ?? [])];
    const result = await runCommand(
      { command: resolved.command, env: resolved.env },
      allArgs,
      process.cwd(),
      { quiet: true },
    );

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

// --- Start server ---
const transport = new StdioServerTransport();
await server.connect(transport);
