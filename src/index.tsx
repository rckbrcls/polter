#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { AppClassic } from "./app.js";
import { AppPanel } from "./appPanel.js";
import { parseCliArgs, printCliHelp } from "./lib/cliArgs.js";
import { runAppCli } from "./apps/runAppCli.js";
import { installMcpServer, removeMcpServer, mcpStatus } from "./lib/mcpInstaller.js";
import { findPipelineByName } from "./pipeline/storage.js";
import { executePipeline } from "./pipeline/engine.js";
import { getCommandById } from "./data/commands/index.js";
import { parsePolterYaml } from "./declarative/parser.js";
import { planChanges } from "./declarative/planner.js";
import { applyActions } from "./declarative/applier.js";
import { getCurrentStatus } from "./declarative/status.js";
import { getToolInfo } from "./lib/toolResolver.js";
import { openInEditor } from "./lib/editor.js";
import { getProjectConfigPath, getOrCreateProjectConfig, writeProjectConfig } from "./config/projectConfig.js";
import pc from "picocolors";
import { getSocketPath } from "./lib/processManager.js";
import { createIpcServer } from "./lib/ipcServer.js";

async function main() {
  const parsed = parseCliArgs(process.argv.slice(2));

  if (parsed.mode === "help") {
    printCliHelp();
    return;
  }

  if (parsed.mode === "mcp") {
    const scope = parsed.mcpScope ?? "local";
    switch (parsed.mcpAction) {
      case "install":
      case "update":
        await installMcpServer(scope);
        break;
      case "remove":
        await removeMcpServer(scope);
        break;
      case "status":
        await mcpStatus();
        break;
    }
    return;
  }

  if (parsed.mode === "app") {
    const exitCode = await runAppCli(parsed.options);
    process.exit(exitCode);
  }

  if (parsed.mode === "pipeline-run") {
    const pipeline = findPipelineByName(parsed.pipelineName!);
    if (!pipeline) {
      process.stderr.write(`Pipeline not found: ${parsed.pipelineName}\n`);
      process.exit(1);
    }

    process.stdout.write(pc.bold(`Running pipeline: ${pipeline.name}\n`));

    const results = await executePipeline(pipeline, (progress) => {
      if (progress.done) return;
      const step = pipeline.steps[progress.currentStepIndex];
      if (step) {
        const cmdDef = getCommandById(step.commandId);
        const label = cmdDef ? `${cmdDef.tool}: ${cmdDef.label}` : step.commandId;
        process.stdout.write(`  ${progress.currentStepIndex + 1}. ${label}...\n`);
      }
    });

    const errors = results.filter((r) => r.status === "error");
    if (errors.length > 0) {
      process.stderr.write(pc.red(`\nPipeline completed with ${errors.length} error(s)\n`));
      process.exit(1);
    }

    process.stdout.write(pc.green("\nPipeline completed successfully!\n"));
    return;
  }

  if (parsed.mode === "status") {
    const tools = ["supabase", "gh", "vercel", "git"] as const;
    process.stdout.write(pc.bold("Tool Status\n\n"));
    for (const toolId of tools) {
      const info = getToolInfo(toolId);
      const status = info.installed
        ? pc.green(`✓ ${info.label} ${info.version ?? ""}`)
        : pc.red(`✗ ${info.label} not found`);
      process.stdout.write(`  ${status}\n`);
    }

    process.stdout.write(pc.bold("\nProject Status\n\n"));
    const projectStatus = getCurrentStatus();
    if (projectStatus.supabase) {
      process.stdout.write(`  Supabase: ${projectStatus.supabase.linked ? "linked" : "not linked"}\n`);
    }
    if (projectStatus.vercel) {
      process.stdout.write(`  Vercel: ${projectStatus.vercel.linked ? "linked" : "not linked"}\n`);
    }
    if (projectStatus.github) {
      process.stdout.write(`  GitHub: ${projectStatus.github.repo ?? "no repo"} ${projectStatus.github.authenticated ? "(authenticated)" : "(not authenticated)"}\n`);
    }
    return;
  }

  if (parsed.mode === "plan") {
    const yaml = parsePolterYaml();
    if (!yaml) {
      process.stderr.write("No polter.yaml found in current directory.\n");
      process.exit(1);
    }

    const plan = planChanges(yaml);
    if (plan.noChanges) {
      process.stdout.write(pc.green("No changes needed. State is up to date.\n"));
      return;
    }

    process.stdout.write(pc.bold(`Plan: ${plan.actions.length} action(s)\n\n`));
    for (const action of plan.actions) {
      const prefix = action.action === "create" ? "+" : action.action === "delete" ? "-" : "~";
      const color = action.action === "create" ? pc.green : action.action === "delete" ? pc.red : pc.yellow;
      process.stdout.write(`  ${color(`${prefix} [${action.tool}] ${action.description}`)}\n`);
    }
    return;
  }

  if (parsed.mode === "apply") {
    const yaml = parsePolterYaml();
    if (!yaml) {
      process.stderr.write("No polter.yaml found in current directory.\n");
      process.exit(1);
    }

    const plan = planChanges(yaml);
    if (plan.noChanges) {
      process.stdout.write(pc.green("No changes needed. State is up to date.\n"));
      return;
    }

    process.stdout.write(pc.bold(`Applying ${plan.actions.length} action(s)...\n\n`));

    const results = await applyActions(plan.actions, process.cwd(), (i, total, action) => {
      process.stdout.write(`  [${i + 1}/${total}] ${action.description}...\n`);
    });

    const errors = results.filter((r) => !r.success);
    if (errors.length > 0) {
      process.stderr.write(pc.red(`\nApply completed with ${errors.length} error(s).\n`));
      for (const err of errors) {
        process.stderr.write(pc.red(`  ✗ ${err.action.description}\n`));
      }
      process.exit(1);
    }

    process.stdout.write(pc.green("\nAll changes applied successfully!\n"));
    return;
  }

  if (parsed.mode === "config") {
    if (parsed.configEdit) {
      const configPath = getProjectConfigPath();
      if (!configPath) {
        process.stderr.write("No package.json found. Run from a project directory.\n");
        process.exit(1);
      }
      // Ensure config file exists before opening
      getOrCreateProjectConfig();
      writeProjectConfig(getOrCreateProjectConfig());
      const result = openInEditor(configPath.file);
      process.exit(result.exitCode ?? 0);
    }
    const AppComponent = parsed.classic ? AppClassic : AppPanel;
    const socketPath = getSocketPath();
    const ipc = socketPath ? createIpcServer(socketPath) : null;
    if (ipc) await ipc.start();
    const inst = render(React.createElement(AppComponent));
    await inst.waitUntilExit();
    if (ipc) await ipc.stop();
    process.exit(0);
  }

  const AppComponent = parsed.classic ? AppClassic : AppPanel;
  const socketPath = getSocketPath();
  const ipc = socketPath ? createIpcServer(socketPath) : null;
  if (ipc) await ipc.start();
  const instance = render(React.createElement(AppComponent));
  await instance.waitUntilExit();
  if (ipc) await ipc.stop();
  process.exit(0);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
