import { describe, expect, it } from "vitest";
import { buildSidebarSections } from "./navigation.js";

describe("buildSidebarSections", () => {
  it("groups desktop views into workflows, features, and system", () => {
    const sections = buildSidebarSections([
      { id: "database", icon: "db", label: "Database", commands: [] },
      { id: "repo", icon: "repo", label: "Repo", commands: [] },
    ]);

    expect(sections.map((section) => section.title)).toEqual([
      "Workflows",
      "Features",
      "System",
    ]);
    expect(sections[1]?.items.map((item) => item.id)).toEqual([
      "feature:database",
      "feature:repo",
    ]);
  });
});
