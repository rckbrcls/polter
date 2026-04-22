#!/usr/bin/env bun
import { parseCliArgs, printCliHelp } from "./lib/cliArgs.js";
import pc from "picocolors";

async function main() {
  const parsed = parseCliArgs(process.argv.slice(2));

  if (parsed.mode === "help") {
    printCliHelp();
    return;
  }

  if (parsed.mode === "mcp") {
    const { installMcpServer, removeMcpServer, mcpStatus } = await import("./lib/mcpInstaller.js");
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

  if (parsed.mode === "setup") {
    const { setupSkillCli } = await import("./lib/skillSetup.js");
    setupSkillCli();
    return;
  }

  if (parsed.mode === "pipeline-run") {
    const { findPipelineByName } = await import("./pipeline/storage.js");
    const { executePipeline } = await import("./pipeline/engine.js");
    const { getCommandById } = await import("./data/commands/index.js");

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
    const { getToolInfo } = await import("./lib/toolResolver.js");
    const { getCurrentStatus } = await import("./declarative/status.js");

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
    const { parsePolterYaml } = await import("./declarative/parser.js");
    const { planChanges } = await import("./declarative/planner.js");

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
    const { parsePolterYaml } = await import("./declarative/parser.js");
    const { planChanges } = await import("./declarative/planner.js");
    const { applyActions } = await import("./declarative/applier.js");

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
      const { getProjectConfigPath, getOrCreateProjectConfig, writeProjectConfig } = await import("./config/projectConfig.js");
      const { openInEditor } = await import("./lib/editor.js");

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
  }

  if (parsed.mode === "uninstall") {
    const { join } = await import("path");
    const { homedir } = await import("os");

    const uninstallDir = join(homedir(), ".polter", "bin");

    process.stdout.write(pc.bold("Polter Uninstaller\n\n"));

    let removed = 0;
    const { existsSync, unlinkSync, readdirSync, rmdirSync } = await import("fs");

    const polterBin = join(uninstallDir, "polter");
    if (existsSync(polterBin)) {
      unlinkSync(polterBin);
      process.stdout.write(`  Removed ${polterBin}\n`);
      removed++;
    }

    const mcpBin = join(uninstallDir, "polter-mcp");
    if (existsSync(mcpBin)) {
      unlinkSync(mcpBin);
      process.stdout.write(`  Removed ${mcpBin}\n`);
      removed++;
    }

    if (removed === 0) {
      process.stdout.write(`  No Polter binaries found in ${uninstallDir}\n`);
    }

    // Remove bin dir if empty
    if (existsSync(uninstallDir) && readdirSync(uninstallDir).length === 0) {
      rmdirSync(uninstallDir);
      process.stdout.write(`  Removed empty directory ${uninstallDir}\n`);
    }

    // Remove .polter dir if empty
    const polterHome = join(homedir(), ".polter");
    if (existsSync(polterHome) && readdirSync(polterHome).length === 0) {
      rmdirSync(polterHome);
      process.stdout.write(`  Removed empty directory ${polterHome}\n`);
    }

    process.stdout.write(pc.green("\nPolter has been uninstalled.\n\n"));
    process.stdout.write("If you added Polter to your PATH, remove this line from your shell profile:\n\n");
    process.stdout.write(`  export PATH="${uninstallDir}:$PATH"\n\n`);
    process.stdout.write("Then restart your terminal or run: source ~/.bashrc  # or ~/.zshrc\n");
    return;
  }

  // TUI mode — only load React/Ink when actually needed
  const React = (await import("react")).default;
  const { render } = await import("ink");
  const { getSocketPath } = await import("./lib/processManager.js");
  const { createIpcServer } = await import("./lib/ipcServer.js");

  // Warm up Conf singleton before React render so useEffect reads are fast (in-memory)
  const { getConf } = await import("./config/globalConf.js");
  getConf();

  const AppComponent = parsed.classic
    ? (await import("./app.js")).AppClassic
    : (await import("./appPanel.js")).AppPanel;

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
