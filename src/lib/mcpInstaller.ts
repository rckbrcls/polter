import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createRequire } from "node:module";
import pc from "picocolors";
import { commandExists } from "./system.js";
import type { McpScope } from "./cliArgs.js";

const require = createRequire(import.meta.url);

const MCP_ARGS = ["npx", "-y", "-p", "@polterware/polter@latest", "polter-mcp"];

const SCOPE_LABELS: Record<McpScope, string> = {
  local: "local (this machine)",
  project: "project (shared via repo)",
  user: "global (all projects)",
};

function tryClaudeCli(scope: McpScope): boolean {
  if (!commandExists("claude")) return false;

  const result = spawnSync("claude", ["mcp", "add", "-s", scope, "polter", "--", ...MCP_ARGS], {
    stdio: "inherit",
    shell: true,
  });

  return result.status === 0;
}

function getSettingsPath(scope: McpScope): string {
  if (scope === "project") {
    return join(process.cwd(), ".mcp.json");
  }
  return join(homedir(), ".claude", "settings.json");
}

function tryManualInstall(scope: McpScope): boolean {
  const settingsPath = getSettingsPath(scope);
  const dir = join(settingsPath, "..");

  let settings: Record<string, unknown> = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    } catch {
      process.stderr.write(pc.red(`Failed to parse ${settingsPath}\n`));
      return false;
    }
  } else {
    mkdirSync(dir, { recursive: true });
  }

  const mcpServers = (settings.mcpServers ?? {}) as Record<string, unknown>;
  mcpServers.polter = {
    command: "npx",
    args: ["-y", "-p", "@polterware/polter@latest", "polter-mcp"],
  };
  settings.mcpServers = mcpServers;

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
  return true;
}

export async function installMcpServer(scope: McpScope): Promise<void> {
  process.stdout.write(pc.bold(`Installing Polter MCP server — ${SCOPE_LABELS[scope]}\n\n`));

  // Try claude CLI first
  if (commandExists("claude")) {
    process.stdout.write(`  Using 'claude mcp add -s ${scope}'...\n`);
    if (tryClaudeCli(scope)) {
      process.stdout.write(pc.green("\n  Done! Restart Claude Code to use Polter tools.\n"));
      return;
    }
    process.stdout.write(pc.yellow("  'claude mcp add' failed, falling back to manual install...\n\n"));
  }

  // Fallback: write settings file directly
  const settingsPath = getSettingsPath(scope);
  process.stdout.write(`  Writing to ${settingsPath}...\n`);
  if (tryManualInstall(scope)) {
    process.stdout.write(pc.green("\n  Done! Restart Claude Code to use Polter tools.\n"));
  } else {
    process.stderr.write(pc.red("\n  Failed to install. Add manually:\n\n"));
    process.stderr.write(`  ${pc.dim(JSON.stringify({ mcpServers: { polter: { command: "npx", args: ["-y", "-p", "@polterware/polter@latest", "polter-mcp"] } } }, null, 2))}\n`);
    process.exit(1);
  }
}

export async function removeMcpServer(scope: McpScope): Promise<void> {
  process.stdout.write(pc.bold(`Removing Polter MCP server — ${SCOPE_LABELS[scope]}\n\n`));

  // Try claude CLI first
  if (commandExists("claude")) {
    const result = spawnSync("claude", ["mcp", "remove", "-s", scope, "polter"], {
      stdio: "inherit",
      shell: true,
    });
    if (result.status === 0) {
      process.stdout.write(pc.green("\n  Done! Polter MCP server removed.\n"));
      return;
    }
    process.stdout.write(pc.yellow("  'claude mcp remove' failed, falling back to manual removal...\n\n"));
  }

  // Fallback: edit settings file directly
  const settingsPath = getSettingsPath(scope);
  if (!existsSync(settingsPath)) {
    process.stdout.write(pc.yellow("  No settings file found. Nothing to remove.\n"));
    return;
  }

  let settings: Record<string, unknown>;
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  } catch {
    process.stderr.write(pc.red(`  Failed to parse ${settingsPath}\n`));
    process.exit(1);
    return;
  }

  const mcpServers = settings.mcpServers as Record<string, unknown> | undefined;
  if (!mcpServers?.polter) {
    process.stdout.write(pc.yellow("  Polter MCP server not found in settings. Nothing to remove.\n"));
    return;
  }

  delete mcpServers.polter;
  settings.mcpServers = mcpServers;
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
  process.stdout.write(pc.green("  Done! Polter MCP server removed.\n"));
}

export async function mcpStatus(): Promise<void> {
  process.stdout.write(pc.bold("Polter MCP Server Status\n\n"));

  // Current installed version
  const pkg = require("../../package.json") as { version: string };
  process.stdout.write(`  Installed version: ${pc.cyan(pkg.version)}\n`);

  // Latest version from npm
  const latestResult = spawnSync("npm", ["view", "@polterware/polter", "version"], {
    encoding: "utf-8",
    shell: true,
    timeout: 10_000,
  });
  const latest = latestResult.stdout?.trim();
  if (latest) {
    const upToDate = latest === pkg.version;
    process.stdout.write(`  Latest version:    ${upToDate ? pc.green(latest) : pc.yellow(`${latest} (update available)`)}\n`);
  }

  process.stdout.write("\n");

  // Check registrations
  const scopes: Array<{ label: string; path: string; key: string }> = [
    { label: "Project (.mcp.json)", path: join(process.cwd(), ".mcp.json"), key: "project" },
    { label: "User (~/.claude/settings.json)", path: join(homedir(), ".claude", "settings.json"), key: "user" },
  ];

  for (const scope of scopes) {
    if (!existsSync(scope.path)) {
      process.stdout.write(`  ${scope.label}: ${pc.dim("not found")}\n`);
      continue;
    }
    try {
      const settings = JSON.parse(readFileSync(scope.path, "utf-8"));
      const mcpServers = settings.mcpServers as Record<string, unknown> | undefined;
      if (mcpServers?.polter) {
        process.stdout.write(`  ${scope.label}: ${pc.green("registered")}\n`);
      } else {
        process.stdout.write(`  ${scope.label}: ${pc.dim("not registered")}\n`);
      }
    } catch {
      process.stdout.write(`  ${scope.label}: ${pc.red("error reading file")}\n`);
    }
  }
}
