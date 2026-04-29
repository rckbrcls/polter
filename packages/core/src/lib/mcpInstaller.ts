import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "./fs.js";
import { join } from "node:path";
import { homedir } from "node:os";
import pc from "picocolors";
import { commandExists } from "./system.js";
import type { McpScope } from "./cliArgs.js";
import packageJson from "../../package.json" with { type: "json" };

const POLTER_MCP_BIN = join(homedir(), ".polter", "bin", "polter-mcp");
const MCP_COMMAND = POLTER_MCP_BIN;

const SCOPE_LABELS: Record<McpScope, string> = {
  local: "local (this machine)",
  project: "project (shared via repo)",
  user: "global (all projects)",
};

function tryClaudeCli(scope: McpScope): boolean {
  if (!commandExists("claude")) return false;

  const result = spawnSync("claude", ["mcp", "add", "-s", scope, "polter", "--", MCP_COMMAND], {
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
    command: MCP_COMMAND,
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
    process.stderr.write(`  ${pc.dim(JSON.stringify({ mcpServers: { polter: { command: MCP_COMMAND } } }, null, 2))}\n`);
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

// --- Structured data variants for richer clients ---

export interface McpStatusInfo {
  installedVersion: string;
  latestVersion: string | null;
  scopes: Array<{
    label: string;
    scope: "project" | "user";
    registered: boolean;
    error?: string;
  }>;
}

export function getMcpStatusInfo(): McpStatusInfo {
  const version = packageJson.version;

  const scopeDefs: Array<{ label: string; path: string; scope: "project" | "user" }> = [
    { label: "Project (.mcp.json)", path: join(process.cwd(), ".mcp.json"), scope: "project" },
    { label: "User (~/.claude/settings.json)", path: join(homedir(), ".claude", "settings.json"), scope: "user" },
  ];

  const scopes = scopeDefs.map((s) => {
    if (!existsSync(s.path)) {
      return { label: s.label, scope: s.scope, registered: false };
    }
    try {
      const settings = JSON.parse(readFileSync(s.path, "utf-8"));
      const mcpServers = settings.mcpServers as Record<string, unknown> | undefined;
      return { label: s.label, scope: s.scope, registered: !!mcpServers?.polter };
    } catch {
      return { label: s.label, scope: s.scope, registered: false, error: "error reading file" };
    }
  });

  return { installedVersion: version, latestVersion: null, scopes };
}

export interface McpActionResult {
  success: boolean;
  message: string;
}

export async function installMcpServerSilent(scope: McpScope): Promise<McpActionResult> {
  const messages: string[] = [];
  messages.push(`Installing Polter MCP server — ${SCOPE_LABELS[scope]}`);

  if (commandExists("claude")) {
    messages.push(`Using 'claude mcp add -s ${scope}'...`);
    if (tryClaudeCli(scope)) {
      messages.push("Done! Restart Claude Code to use Polter tools.");
      return { success: true, message: messages.join("\n") };
    }
    messages.push("'claude mcp add' failed, falling back to manual install...");
  }

  const settingsPath = getSettingsPath(scope);
  messages.push(`Writing to ${settingsPath}...`);
  if (tryManualInstall(scope)) {
    messages.push("Done! Restart Claude Code to use Polter tools.");
    return { success: true, message: messages.join("\n") };
  }

  return { success: false, message: "Failed to install. Try manual installation." };
}

export async function removeMcpServerSilent(scope: McpScope): Promise<McpActionResult> {
  const messages: string[] = [];
  messages.push(`Removing Polter MCP server — ${SCOPE_LABELS[scope]}`);

  if (commandExists("claude")) {
    const result = spawnSync("claude", ["mcp", "remove", "-s", scope, "polter"], {
      encoding: "utf-8",
      shell: true,
    });
    if (result.status === 0) {
      messages.push("Done! Polter MCP server removed.");
      return { success: true, message: messages.join("\n") };
    }
    messages.push("'claude mcp remove' failed, falling back to manual removal...");
  }

  const settingsPath = getSettingsPath(scope);
  if (!existsSync(settingsPath)) {
    messages.push("No settings file found. Nothing to remove.");
    return { success: true, message: messages.join("\n") };
  }

  let settings: Record<string, unknown>;
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  } catch {
    return { success: false, message: `Failed to parse ${settingsPath}` };
  }

  const mcpServers = settings.mcpServers as Record<string, unknown> | undefined;
  if (!mcpServers?.polter) {
    messages.push("Polter MCP server not found in settings. Nothing to remove.");
    return { success: true, message: messages.join("\n") };
  }

  delete mcpServers.polter;
  settings.mcpServers = mcpServers;
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
  messages.push("Done! Polter MCP server removed.");
  return { success: true, message: messages.join("\n") };
}

export async function mcpStatus(): Promise<void> {
  process.stdout.write(pc.bold("Polter MCP Server Status\n\n"));

  // Current installed version
  const pkgVersion = packageJson.version;
  process.stdout.write(`  Installed version: ${pc.cyan(pkgVersion)}\n`);

  // Latest version from GitHub
  const latestResult = spawnSync("bash", ["-c", `curl -fsSL https://api.github.com/repos/polterware/polter/releases/latest 2>/dev/null | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"v\\([^"]*\\)".*/\\1/p' | head -1`], {
    encoding: "utf-8",
    timeout: 10_000,
  });
  const latest = latestResult.stdout?.trim();
  if (latest) {
    const upToDate = latest === pkgVersion;
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
