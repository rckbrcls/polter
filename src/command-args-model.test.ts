import { describe, expect, it } from "vitest";
import { getSuggestedArgOptions } from "./data/suggestedArgs.js";
import {
  buildCommandArgItems,
  getRunCommandFromArgsSelection,
} from "./screens/commandArgsModel.js";

describe("commandArgsModel", () => {
  it("marks suggested runs and base run as pinnable", () => {
    const suggestions = getSuggestedArgOptions("db");
    const items = buildCommandArgItems({
      command: "db",
      suggestions,
      pinnedRuns: ["db pull", "db"],
    });

    const pullItem = items.find((item) => item.value === "suggest:pull");
    const baseRunItem = items.find((item) => item.value === "__run_base__");

    expect(pullItem?.rightActionable).toBe(true);
    expect(pullItem?.hint).toContain("pinned run");
    expect(baseRunItem?.rightActionable).toBe(true);
    expect(baseRunItem?.hint).toContain("pinned run");
  });

  it("resolves selectable subcommand items to exact run commands", () => {
    const suggestions = getSuggestedArgOptions("db");

    expect(
      getRunCommandFromArgsSelection("db", "suggest:pull", suggestions),
    ).toBe("db pull");
    expect(
      getRunCommandFromArgsSelection("db", "__run_base__", suggestions),
    ).toBe("db");
    expect(
      getRunCommandFromArgsSelection("db", "__custom__", suggestions),
    ).toBeUndefined();
  });
});
