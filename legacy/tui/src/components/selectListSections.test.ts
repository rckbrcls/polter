import { describe, expect, it } from "vitest";
import {
  buildBoxedSectionLayout,
  countBoxedSectionLines,
} from "./selectListSections.js";
import { buildMainMenuItems } from "../screens/mainMenuModel.js";

describe("buildBoxedSectionLayout", () => {
  it("keeps standalone menu headings outside the command boxes", () => {
    const items = buildMainMenuItems({
      pinnedRuns: [],
      pinnedCommands: [],
    });
    const sections = buildBoxedSectionLayout(items, 0, 6);

    expect(sections).toHaveLength(2);
    expect(sections[0]).toMatchObject({
      type: "heading",
      label: "📂 All Commands",
    });
    expect(sections[1]).toMatchObject({
      type: "box",
      title: "🚀  Quick Start",
    });
  });

  it("inherits the previous header when the window starts in the middle of a section", () => {
    const items = buildMainMenuItems({
      pinnedRuns: [],
      pinnedCommands: [],
    });
    const startIndex = items.findIndex((item) => item.id === "cmd-local-dev-start");
    const sections = buildBoxedSectionLayout(items, startIndex, startIndex + 3);

    expect(sections).toHaveLength(1);
    expect(sections[0]).toMatchObject({
      type: "box",
      title: "🛠  Local Dev",
    });
  });

  it("counts box borders in the rendered line budget", () => {
    const items = buildMainMenuItems({
      pinnedRuns: [],
      pinnedCommands: [],
    });
    const sections = buildBoxedSectionLayout(items, 0, 6);

    expect(countBoxedSectionLines(sections)).toBe(8);
  });
});
