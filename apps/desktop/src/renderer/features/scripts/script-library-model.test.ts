import { describe, expect, it } from "vitest";
import type { DesktopWorkspaceSnapshot, ScriptTemplate } from "../workbench/types.js";
import {
  buildScriptLibrary,
  createCustomScript,
  createStageTarget,
  filterScriptLibraryItems,
  getPackageScriptCommandLine,
  getRepoScriptPath,
} from "./script-library-model.js";

const packageManager = {
  id: "pnpm",
  lockFile: "pnpm-lock.yaml",
  command: "pnpm",
} as const;

const workspace: DesktopWorkspaceSnapshot = {
  cwd: "/workspace/polter",
  root: "/workspace/polter",
  packageManager,
  rootScripts: [{ name: "test", command: "vitest run" }],
  childRepos: [
    {
      name: "apps/desktop",
      path: "/workspace/polter/apps/desktop",
      scripts: [{ name: "typecheck", command: "tsc --noEmit" }],
      pkgManager: packageManager,
    },
  ],
  projectConfig: {
    version: 1,
    tools: {},
    pipelines: [],
  },
};

const templates: ScriptTemplate[] = [
  {
    id: "clean",
    name: "Clean Workspace",
    description: "Clean local workspace files.",
    language: "shell",
    body: "rm -rf node_modules",
  },
];

describe("script library model", () => {
  it("builds repo-local paths for shell and Python scripts", () => {
    expect(getRepoScriptPath("/workspace/polter", "Clean Workspace", "shell")).toBe(
      "/workspace/polter/.polter/scripts/clean-workspace.sh",
    );
    expect(getRepoScriptPath("/workspace/polter", "Summarize Failures", "python")).toBe(
      "/workspace/polter/.polter/scripts/summarize-failures.py",
    );
  });

  it("resolves package script commands for root and child workspaces", () => {
    expect(getPackageScriptCommandLine("pnpm", "/workspace/polter", "test", "/workspace/polter")).toBe(
      "pnpm run test",
    );
    expect(
      getPackageScriptCommandLine(
        "pnpm",
        "/workspace/polter/apps/desktop",
        "typecheck",
        "/workspace/polter",
      ),
    ).toBe("pnpm --dir /workspace/polter/apps/desktop run typecheck");
  });

  it("builds and filters custom, package, and template entries", () => {
    const customScript = createCustomScript({
      id: "custom:clean",
      name: "Clean Workspace",
      description: "Clean local workspace files.",
      language: "shell",
      repoName: "Root workspace",
      repoPath: workspace.root,
      body: "rm -rf node_modules",
    });
    const library = buildScriptLibrary({
      customScripts: [customScript],
      templates,
      workspace,
    });

    expect(filterScriptLibraryItems(library, "custom")).toHaveLength(1);
    expect(filterScriptLibraryItems(library, "package")).toHaveLength(2);
    expect(filterScriptLibraryItems(library, "template")).toHaveLength(1);
    expect(createStageTarget(customScript)).toMatchObject({
      commandLine: "sh /workspace/polter/.polter/scripts/clean-workspace.sh",
      source: "custom",
    });
  });
});
