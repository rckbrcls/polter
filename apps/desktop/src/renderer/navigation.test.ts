import { describe, expect, it } from "vitest";
import {
  getViewIcon,
  headerWorkflowItems,
  systemSidebarItems,
  workflowNavigationItems,
} from "./navigation.js";

describe("desktop navigation", () => {
  it("keeps workflow surfaces as the primary numbered toolbar routes", () => {
    expect(headerWorkflowItems).toEqual([
      { id: "processes", label: "Processes", shortcut: 1 },
      { id: "pipelines", label: "Pipelines", shortcut: 2 },
      { id: "scripts", label: "Scripts", shortcut: 3 },
      { id: "infrastructure", label: "Infrastructure", shortcut: 4 },
      { id: "project-config", label: "Project Config", shortcut: 5 },
    ]);
    expect(headerWorkflowItems.some((item) => item.id.startsWith("feature:"))).toBe(false);
  });

  it("keeps workflows as a separate navigation catalog", () => {
    expect(workflowNavigationItems.map((item) => item.label)).toEqual([
      "Processes",
      "Pipelines",
      "Scripts",
      "Infrastructure",
      "Project Config",
    ]);
  });

  it("keeps scripts and project configuration visually distinct", () => {
    expect(getViewIcon("scripts")).not.toBe(getViewIcon("project-config"));
  });

  it("keeps system navigation as a separate footer menu catalog", () => {
    expect(systemSidebarItems.map((item) => item.label)).toEqual([
      "Tool Status",
      "MCP",
      "Skill Setup",
      "Settings",
    ]);
  });
});
