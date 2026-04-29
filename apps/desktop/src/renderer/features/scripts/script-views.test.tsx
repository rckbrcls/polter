import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type {
  DesktopWorkspaceSnapshot,
  ScriptLibraryItem,
  ScriptTemplate,
} from "../workbench/types.js";
import type { Workbench } from "../workbench/use-workbench.js";
import {
  buildScriptLibrary,
  createCustomScript,
  createPackageScriptItems,
  createStageTarget,
  filterScriptLibraryItems,
} from "./script-library-model.js";
import { ScriptEditor, ScriptRow, ScriptsView } from "./script-views.js";

const packageManager = {
  id: "pnpm",
  lockFile: "pnpm-lock.yaml",
  command: "pnpm",
} as const;

const workspace: DesktopWorkspaceSnapshot = {
  cwd: "/mock/polter",
  root: "/mock/polter",
  packageManager,
  rootScripts: [{ name: "test", command: "vitest run" }],
  childRepos: [],
  projectConfig: {
    version: 1,
    tools: {},
    pipelines: [],
  },
};

const customScript = createCustomScript({
  id: "custom:collect-env",
  name: "Collect Env",
  description: "Collect local environment state.",
  language: "shell",
  repoName: "Root workspace",
  repoPath: workspace.root,
  body: "node --version",
});

const template: ScriptTemplate = {
  id: "clean-node-artifacts",
  name: "Clean Node Artifacts",
  description: "Remove local install artifacts.",
  language: "shell",
  body: "rm -rf node_modules",
};

function workbench(overrides: Partial<Workbench> = {}): Workbench {
  return {
    customScripts: [customScript],
    duplicateScriptTemplate: vi.fn(async () => customScript),
    saveCustomScript: vi.fn(async (script) => script),
    scriptTemplates: [template],
    stageProcessCommand: vi.fn(),
    workspace,
    ...overrides,
  } as unknown as Workbench;
}

describe("ScriptsView", () => {
  it("renders a minimal list surface without redundant header copy", () => {
    const markup = renderToStaticMarkup(<ScriptsView workbench={workbench()} />);

    expect(markup).toContain("Custom");
    expect(markup).toContain("Package");
    expect(markup).toContain("Templates");
    expect(markup).toContain("New Shell");
    expect(markup).toContain("New Python");
    expect(markup).toContain("Collect Env");
    expect(markup).toContain(".polter/scripts");

    expect(markup).not.toContain("Script Library");
    expect(markup).not.toContain("Prepare reusable workspace scripts");
    expect(markup).not.toContain("script-name");
    expect(markup).not.toContain("script-description");
    expect(markup).not.toContain("script-body");
    expect(markup).not.toContain("Save mock script");
    expect(markup).not.toContain("Run mock");
  });

  it("renders the dedicated editor actions and fields", () => {
    const markup = renderToStaticMarkup(
      <ScriptEditor
        script={customScript}
        onBack={vi.fn()}
        onSave={vi.fn()}
        onStage={vi.fn()}
      />,
    );

    expect(markup).toContain("Back");
    expect(markup).toContain("Save mock script");
    expect(markup).toContain("Stage in Processes");
    expect(markup).toContain("script-name");
    expect(markup).toContain("script-description");
    expect(markup).toContain("script-language");
    expect(markup).toContain("script-body");
    expect(markup).toContain("Command");
    expect(markup).toContain(".polter/scripts");
  });

  it("keeps package and template rows in library semantics", () => {
    const library = buildScriptLibrary({
      customScripts: [customScript],
      templates: [template],
      workspace,
    });
    const packageScript = createPackageScriptItems(workspace)[0] as ScriptLibraryItem;
    const templateScript = filterScriptLibraryItems(library, "template")[0] as ScriptLibraryItem;
    const packageMarkup = renderToStaticMarkup(
      <ScriptRow script={packageScript} onSelect={vi.fn()} />,
    );
    const templateMarkup = renderToStaticMarkup(
      <ScriptRow script={templateScript} onSelect={vi.fn()} />,
    );

    expect(createStageTarget(packageScript)).toMatchObject({
      commandLine: "pnpm run test",
      source: "package",
    });
    expect(packageMarkup).toContain("Stage in Processes");
    expect(templateMarkup).toContain("Duplicate");
    expect(packageMarkup).not.toContain("Run mock");
    expect(templateMarkup).not.toContain("Run mock");
    expect(packageMarkup).not.toContain("Run in background");
    expect(templateMarkup).not.toContain("Run in background");
  });
});
