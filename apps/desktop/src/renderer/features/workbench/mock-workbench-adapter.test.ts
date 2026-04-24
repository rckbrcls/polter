import { describe, expect, it } from "vitest";
import { createMockWorkbenchAdapter } from "./mock-workbench-adapter.js";

describe("mock workbench adapter", () => {
  it("returns an immediate UI snapshot without a backend bridge", async () => {
    const adapter = createMockWorkbenchAdapter();
    const snapshot = await adapter.getSnapshot();

    expect(snapshot.appInfo).toMatchObject({
      name: "Polter Desktop",
      version: "0.1.0-ui-preview",
    });
    expect(snapshot.features.length).toBeGreaterThan(0);
    expect(snapshot.repositories.length).toBeGreaterThan(0);
    expect(snapshot.workspace.rootScripts.length).toBeGreaterThan(0);
    expect(snapshot.customScripts.length).toBeGreaterThan(0);
    expect(snapshot.scriptTemplates.length).toBeGreaterThan(0);
  });

  it("simulates command execution without running external commands", async () => {
    const adapter = createMockWorkbenchAdapter();
    const result = await adapter.runCommand({
      commandId: "git:status",
      args: ["--short"],
    });

    expect(result).toMatchObject({
      commandId: "git:status",
      success: true,
      exitCode: 0,
    });
    expect(result.stdout).toContain("No external command was executed.");
  });

  it("saves and removes mock pipelines", async () => {
    const adapter = createMockWorkbenchAdapter();
    const saved = await adapter.savePipeline(
      {
        id: "",
        name: "Release preview",
        description: "Preview release workflow.",
        createdAt: "",
        updatedAt: "",
        steps: [
          {
            id: "status",
            commandId: "git:status",
            args: [],
            flags: [],
            continueOnError: false,
          },
        ],
      },
      "project",
    );

    expect((await adapter.getSnapshot()).pipelines.some((pipeline) => pipeline.id === saved.id)).toBe(
      true,
    );

    await adapter.removePipeline(saved.id, "project");

    expect((await adapter.getSnapshot()).pipelines.some((pipeline) => pipeline.id === saved.id)).toBe(
      false,
    );
  });

  it("starts, stops, removes, and logs mock processes", async () => {
    const adapter = createMockWorkbenchAdapter();
    const started = await adapter.startProcess("pnpm", ["test"], "/mock/polter");

    expect(started).toMatchObject({
      command: "pnpm",
      status: "running",
      pid: undefined,
    });
    await expect(adapter.getProcessLogs(started.id)).resolves.toMatchObject({
      stderrLineCount: 0,
    });

    const stopped = await adapter.stopProcess(started.id);
    expect(stopped).toMatchObject({
      status: "exited",
      exitCode: 0,
    });

    await adapter.removeProcess(started.id);
    expect((await adapter.listProcesses()).some((processInfo) => processInfo.id === started.id)).toBe(
      false,
    );
  });

  it("duplicates script templates into mock custom scripts", async () => {
    const adapter = createMockWorkbenchAdapter();
    const created = await adapter.duplicateScriptTemplate("clean-node-artifacts", "/mock/polter");

    expect(created).toMatchObject({
      source: "custom",
      name: "Clean Node Artifacts",
      path: "/mock/polter/.polter/scripts/clean-node-artifacts.sh",
    });
    expect(
      (await adapter.getSnapshot()).customScripts.some((script) => script.id === created.id),
    ).toBe(true);
  });
});
