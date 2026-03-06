import { describe, expect, it } from "vitest";
import { buildCommandArgItems } from "./commandArgsModel.js";

describe("buildCommandArgItems", () => {
  it("separates suggested args and actions into distinct sections", () => {
    const items = buildCommandArgItems({
      command: "db",
      suggestions: [
        {
          value: "pull",
          label: "pull",
          hint: "Pull schema from remote",
          args: ["pull"],
        },
      ],
      pinnedRuns: [],
    });

    expect(items.map((item) => item.value)).toEqual([
      "__suggested_header__",
      "suggest:pull",
      "__actions_header__",
      "__run_base__",
      "__custom__",
    ]);
  });
});
