import { describe, expect, it } from "vitest";
import {
  headerWorkflowItems,
  systemSidebarItems,
  workflowNavigationItems,
} from "./navigation.js";

describe("desktop navigation", () => {
  it("keeps workflow surfaces as the primary numbered toolbar routes", () => {
    expect(headerWorkflowItems).toEqual([
      { id: "pipelines", label: "Pipelines", shortcut: 1 },
      { id: "processes", label: "Processes", shortcut: 2 },
      { id: "scripts", label: "Scripts", shortcut: 3 },
    ]);
    expect(headerWorkflowItems.some((item) => item.id.startsWith("feature:"))).toBe(false);
  });

  it("keeps workflows as a separate navigation catalog", () => {
    expect(workflowNavigationItems.map((item) => item.label)).toEqual([
      "Pipelines",
      "Processes",
      "Scripts",
    ]);
  });

  it("keeps system navigation as a separate footer menu catalog", () => {
    expect(systemSidebarItems.map((item) => item.label)).toEqual([
      "Infrastructure",
      "Tool Status",
      "Project Config",
      "MCP",
      "Skill Setup",
      "Settings",
    ]);
  });
});
