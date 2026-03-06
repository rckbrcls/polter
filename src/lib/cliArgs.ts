import type { AppAction, MigrationAction, ParsedCliOptions } from "../apps/types.js";

export type CliMode = "interactive" | "app" | "help" | "pipeline-run" | "config" | "plan" | "apply" | "status" | "mcp";

export type McpScope = "project" | "user" | "local";
export type McpAction = "install" | "update" | "status" | "remove";

export interface ParsedCliCommand {
  mode: CliMode;
  options: ParsedCliOptions;
  pipelineName?: string;
  configEdit?: boolean;
  classic?: boolean;
  mcpScope?: McpScope;
  mcpAction?: McpAction;
}

function takeValue(
  args: string[],
  index: number,
): { value?: string; nextIndex: number } {
  const token = args[index];
  if (!token) {
    return { nextIndex: index };
  }

  const eqIndex = token.indexOf("=");
  if (eqIndex >= 0) {
    return {
      value: token.slice(eqIndex + 1),
      nextIndex: index,
    };
  }

  return { value: args[index + 1], nextIndex: index + 1 };
}

export function parseCliArgs(argv: string[]): ParsedCliCommand {
  const classic = argv.includes("--classic");
  const filteredArgv = argv.filter((a) => a !== "--classic");

  if (filteredArgv.length === 0) {
    return { mode: "interactive", options: {}, classic };
  }

  if (filteredArgv[0] === "--help" || filteredArgv[0] === "help") {
    return { mode: "help", options: {} };
  }

  // Use filteredArgv from here on
  const argv_ = filteredArgv;

  // New subcommands
  if (argv_[0] === "pipeline" && argv_[1] === "run" && argv_[2]) {
    return { mode: "pipeline-run", options: {}, pipelineName: argv_[2] };
  }

  if (argv_[0] === "mcp") {
    const sub = argv_[1];
    if (sub === "status") {
      return { mode: "mcp", options: {}, mcpAction: "status" };
    }
    if (sub === "install" || sub === "update" || sub === "remove") {
      let mcpScope: McpScope = "local";
      if (argv_.includes("--project")) mcpScope = "project";
      else if (argv_.includes("--global")) mcpScope = "user";
      return { mode: "mcp", options: {}, mcpAction: sub, mcpScope };
    }
  }

  if (argv_[0] === "config") {
    const edit = argv_.includes("--edit");
    return { mode: "config", options: {}, configEdit: edit, classic };
  }

  if (argv_[0] === "plan") {
    return { mode: "plan", options: {} };
  }

  if (argv_[0] === "apply") {
    return { mode: "apply", options: {} };
  }

  if (argv_[0] === "status") {
    return { mode: "status", options: {} };
  }

  if (argv_[0] !== "app") {
    return { mode: "interactive", options: {}, classic };
  }

  const options: ParsedCliOptions = {};
  options.action = argv_[1] as AppAction | undefined;
  options.app = argv_[2];

  for (let index = 3; index < argv_.length; index += 1) {
    const token = argv_[index]!;

    if (token === "push" || token === "lint" || token === "reset" || token === "local-reset") {
      options.migrationAction = token as MigrationAction;
      continue;
    }

    if (token === "--yes") {
      options.yes = true;
      continue;
    }

    if (token === "--relink") {
      options.relink = true;
      continue;
    }

    if (token === "--create-project") {
      options.createProject = true;
      continue;
    }

    if (token === "--use-existing-project") {
      options.useExistingProject = true;
      continue;
    }

    if (token.startsWith("--path")) {
      const parsed = takeValue(argv_, index);
      options.path = parsed.value;
      index = parsed.nextIndex;
      continue;
    }

    if (token.startsWith("--version")) {
      const parsed = takeValue(argv_, index);
      options.version = parsed.value;
      index = parsed.nextIndex;
      continue;
    }

    if (token.startsWith("--artifact-url")) {
      const parsed = takeValue(argv_, index);
      options.artifactUrl = parsed.value;
      index = parsed.nextIndex;
      continue;
    }

    if (token.startsWith("--install-dir")) {
      const parsed = takeValue(argv_, index);
      options.installDir = parsed.value;
      index = parsed.nextIndex;
      continue;
    }
  }

  return {
    mode: "app",
    options,
  };
}

export function printCliHelp(): void {
  process.stdout.write(
    [
      "Polter — Project & Infrastructure Orchestrator",
      "",
      "Usage:",
      "  polter                           Interactive mode",
      "  polter pipeline run <name>       Run a saved pipeline",
      "  polter config                    Manage per-repo config",
      "  polter config --edit             Open config in $EDITOR",
      "  polter plan                      Show declarative state diff",
      "  polter apply                     Apply declarative state changes",
      "  polter status                    Show current tool status",
      "  polter mcp install               Install Polter MCP server into Claude Code (local scope)",
      "  polter mcp install --project     Install for this project only (shared via repo)",
      "  polter mcp install --global      Install globally for all projects",
      "  polter mcp update                Update MCP server to latest version",
      "  polter mcp status                Show MCP registration and version info",
      "  polter mcp remove                Remove MCP server registration",
      "",
      "  polter app setup ops [--path <dir>] [--create-project|--use-existing-project] [--yes]",
      "  polter app link ops [--path <dir>] [--relink]",
      "  polter app migrate ops [push|lint|reset|local-reset] [--path <dir>] [--relink]",
      "  polter app configure ops [--path <dir>] [--yes]",
      "  polter app install ops [--version <version>] [--artifact-url <url>] [--install-dir <dir>] [--yes]",
      "  polter app update ops [--version <version>] [--artifact-url <url>] [--install-dir <dir>] [--yes]",
      "",
      "Options:",
      "  --classic                        Use classic single-screen UI",
      "",
    ].join("\n"),
  );
}
