import { describe, expect, it } from "vitest";
import { buildMainMenuItems } from "./screens/mainMenuModel.js";

describe("buildMainMenuItems", () => {
  it("creates pinned runs, pinned commands, commands, and actions in order", () => {
    const items = buildMainMenuItems({
      pinnedRuns: ["db pull --debug"],
      pinnedCommands: ["start"],
    });

    const pinnedRunsIndex = items.findIndex(
      (item) => item.id === "section-pinned-runs",
    );
    const pinnedCommandsIndex = items.findIndex(
      (item) => item.id === "section-pinned-commands",
    );
    const allCommandsIndex = items.findIndex(
      (item) => item.id === "section-all-commands",
    );
    const actionsIndex = items.findIndex(
      (item) => item.id === "section-actions",
    );

    expect(pinnedRunsIndex).toBeGreaterThanOrEqual(0);
    expect(pinnedCommandsIndex).toBeGreaterThan(pinnedRunsIndex);
    expect(allCommandsIndex).toBeGreaterThan(pinnedCommandsIndex);
    expect(actionsIndex).toBeGreaterThan(allCommandsIndex);
  });

  it("shows pinned runs and pinned commands together in the board", () => {
    const items = buildMainMenuItems({
      pinnedRuns: ["db pull --debug"],
      pinnedCommands: ["start"],
    });

    const startItems = items.filter(
      (item) => item.kind === "command" && item.value === "start",
    );
    const runItems = items.filter(
      (item) => item.kind === "run" && item.value === "db pull --debug",
    );

    expect(startItems.length).toBe(2);
    expect(startItems.some((item) => item.id === "command:start")).toBe(true);
    expect(startItems.some((item) => item.id === "cmd-local-dev-start")).toBe(true);
    expect(runItems.length).toBe(1);
    expect(runItems[0]?.section).toBe("pinned-runs");
  });

  it("always includes action items", () => {
    const items = buildMainMenuItems({
      pinnedRuns: [],
      pinnedCommands: [],
    });
    const actionIds = items
      .filter((item) => item.kind === "action")
      .map((item) => item.id);

    expect(items.some((item) => item.id === "action-custom")).toBe(true);
    expect(items.some((item) => item.id === "action-update")).toBe(true);
    expect(items.some((item) => item.id === "action-exit")).toBe(true);
    expect(actionIds).toEqual([
      "action-custom",
      "action-update",
      "action-exit",
    ]);
  });
});
