import { describe, expect, it } from "vitest";
import { getSuggestedArgOptions } from "./data/suggestedArgs.js";

describe("suggestedArgs", () => {
  it("returns selectable options for db command", () => {
    const options = getSuggestedArgOptions("db");
    const values = options.map((option) => option.value);

    expect(values).toContain("pull");
    expect(values).toContain("push");
    expect(values).toContain("reset");
  });

  it("returns empty list for unknown command", () => {
    expect(getSuggestedArgOptions("nonexistent")).toEqual([]);
  });
});
