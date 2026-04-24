import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { CommandDef } from "../workbench/types.js";
import type { Workbench } from "../workbench/use-workbench.js";
import { ProcessCommandBoard } from "./process-command-board.js";
import {
  filterKnownCommands,
  findKnownCommandByInput,
  resolveKnownProcessCommand,
  resolveManualProcessCommand,
} from "./process-command-model.js";
import { ProcessesView } from "./process-views.js";

const commands: CommandDef[] = [
  {
    id: "pkg:typecheck",
    tool: "pkg",
    base: ["typecheck"],
    label: "Typecheck",
    hint: "Run TypeScript checks.",
  },
  {
    id: "git:status",
    tool: "git",
    base: ["status"],
    label: "Git Status",
    hint: "Inspect repository state.",
    isReadOnly: true,
  },
];

function workbench(overrides: Partial<Workbench> = {}): Workbench {
  return {
    allCommands: commands,
    pins: {
      commandPins: ["git:status"],
      runPins: ["pnpm test src/renderer"],
    },
    clearProcessCommandDraft: vi.fn(),
    processCommandDraft: "",
    refreshWorkspaceScripts: vi.fn(),
    runWorkspaceScript: vi.fn(),
    startProcessFromCommandLine: vi.fn(),
    workspace: {
      cwd: "/mock/polter",
      root: "/mock/polter",
      packageManager: { id: "pnpm", lockFile: "pnpm-lock.yaml", command: "pnpm" },
      rootScripts: [{ name: "test", command: "vitest run" }],
      childRepos: [],
      projectConfig: {
        version: 1,
        tools: {},
        pipelines: [],
      },
    },
    ...overrides,
  } as unknown as Workbench;
}

describe("ProcessesView", () => {
  it("renders direct process launch controls without staging cards", () => {
    const markup = renderToStaticMarkup(<ProcessesView workbench={workbench()} />);

    expect(markup).toContain("Search or type a command");
    expect(markup).toContain("Start command");
    expect(markup).toContain("Pinned");

    expect(markup).not.toContain("Package scripts");
    expect(markup).not.toContain("pnpm run test");
    expect(markup).not.toContain("Known");
    expect(markup).not.toContain("Manual");
    expect(markup).not.toContain("Add command");
    expect(markup).not.toContain("Create pipeline");
    expect(markup).not.toContain("Run all");
    expect(markup).not.toContain("idle");
  });

  it("renders the command board without staged command controls", () => {
    const markup = renderToStaticMarkup(
      <ProcessCommandBoard
        knownCommandResults={commands}
        onCommandInputRun={vi.fn()}
        onKnownCommandSelect={vi.fn()}
        onPinnedCommandRun={vi.fn()}
        onSearchQueryChange={vi.fn()}
        pinnedCommands={["git:status"]}
        searchQuery="pnpm test"
        selectedKnownCommand={null}
        selectedKnownCommandId=""
      />,
    );

    expect(markup).toContain("process-command-input");
    expect(markup).toContain("Start command");
    expect(markup).toContain("pnpm test");
    expect(markup).not.toContain("Review this staged command");
    expect(markup).not.toContain("Package scripts");
    expect(markup).not.toContain("Create pipeline");
    expect(markup).not.toContain("Run all");
  });

  it("filters known commands for autocomplete", () => {
    expect(filterKnownCommands(commands, "type").map((command) => command.label)).toEqual([
      "Typecheck",
    ]);
    expect(filterKnownCommands(commands, "repository").map((command) => command.label)).toEqual([
      "Git Status",
    ]);
  });

  it("resolves manual command lines for direct process launch", () => {
    expect(resolveManualProcessCommand("pnpm test src/renderer")).toEqual({
      command: "pnpm",
      args: ["test", "src/renderer"],
    });
    expect(resolveManualProcessCommand("   ")).toBeNull();
  });

  it("resolves known and pinned commands for direct process launch", () => {
    expect(resolveKnownProcessCommand(commands[0]!, "pnpm")).toEqual({
      command: "pnpm",
      args: ["typecheck"],
    });
    expect(resolveKnownProcessCommand(commands[1]!, "pnpm")).toEqual({
      command: "git",
      args: ["status"],
    });
    expect(findKnownCommandByInput(commands, "git:status")).toBe(commands[1]);
    expect(findKnownCommandByInput(commands, "Typecheck")).toBe(commands[0]);
    expect(findKnownCommandByInput(commands, "pnpm test")).toBeNull();
  });
});
