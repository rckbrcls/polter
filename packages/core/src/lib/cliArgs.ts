export type CliMode = "interactive" | "help" | "pipeline-run" | "config" | "plan" | "apply" | "status" | "mcp" | "setup" | "uninstall";

export type McpScope = "project" | "user" | "local";
export type McpAction = "install" | "update" | "status" | "remove";

export interface ParsedCliCommand {
  mode: CliMode;
  pipelineName?: string;
  configEdit?: boolean;
  classic?: boolean;
  mcpScope?: McpScope;
  mcpAction?: McpAction;
}

export function parseCliArgs(argv: string[]): ParsedCliCommand {
  const classic = argv.includes("--classic");
  const filteredArgv = argv.filter((a) => a !== "--classic");

  if (filteredArgv.length === 0) {
    return { mode: "interactive", classic };
  }

  if (filteredArgv[0] === "--help" || filteredArgv[0] === "help") {
    return { mode: "help" };
  }

  // Use filteredArgv from here on
  const argv_ = filteredArgv;

  // New subcommands
  if (argv_[0] === "pipeline" && argv_[1] === "run" && argv_[2]) {
    return { mode: "pipeline-run", pipelineName: argv_[2] };
  }

  if (argv_[0] === "mcp") {
    const sub = argv_[1];
    if (sub === "status") {
      return { mode: "mcp", mcpAction: "status" };
    }
    if (sub === "install" || sub === "update" || sub === "remove") {
      let mcpScope: McpScope = "local";
      if (argv_.includes("--project")) mcpScope = "project";
      else if (argv_.includes("--global")) mcpScope = "user";
      return { mode: "mcp", mcpAction: sub, mcpScope };
    }
  }

  if (argv_[0] === "config") {
    const edit = argv_.includes("--edit");
    return { mode: "config", configEdit: edit, classic };
  }

  if (argv_[0] === "plan") {
    return { mode: "plan" };
  }

  if (argv_[0] === "apply") {
    return { mode: "apply" };
  }

  if (argv_[0] === "setup") {
    return { mode: "setup" };
  }

  if (argv_[0] === "status") {
    return { mode: "status" };
  }

  if (argv_[0] === "uninstall") {
    return { mode: "uninstall" };
  }

  return { mode: "interactive", classic };
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
      "  polter setup                     Install Polter skill for Claude Code",
      "  polter status                    Show current tool status",
      "  polter mcp install               Install Polter MCP server into Claude Code (local scope)",
      "  polter mcp install --project     Install for this project only (shared via repo)",
      "  polter mcp install --global      Install globally for all projects",
      "  polter mcp update                Update MCP server to latest version",
      "  polter mcp status                Show MCP registration and version info",
      "  polter mcp remove                Remove MCP server registration",
      "  polter uninstall                 Remove Polter binaries from ~/.polter/bin",
      "",
      "Options:",
      "  --classic                        Use classic single-screen UI",
      "",
    ].join("\n"),
  );
}
