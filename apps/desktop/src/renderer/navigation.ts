import type { Feature } from "@polterware/core";

export type SidebarViewId =
  | "pinned"
  | "pipelines"
  | "processes"
  | "scripts"
  | "infrastructure"
  | "tool-status"
  | "project-config"
  | "mcp"
  | "skills"
  | "settings"
  | `feature:${string}`;

export interface SidebarItem {
  id: SidebarViewId;
  label: string;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export function buildSidebarSections(features: Feature[]): SidebarSection[] {
  return [
    {
      title: "Workflows",
      items: [
        { id: "pipelines", label: "Pipelines" },
        { id: "pinned", label: "Pinned" },
        { id: "processes", label: "Processes" },
        { id: "scripts", label: "Scripts" },
      ],
    },
    {
      title: "Features",
      items: features.map((feature) => ({
        id: `feature:${feature.id}`,
        label: feature.label,
      })),
    },
    {
      title: "System",
      items: [
        { id: "infrastructure", label: "Infrastructure" },
        { id: "tool-status", label: "Tool Status" },
        { id: "project-config", label: "Project Config" },
        { id: "mcp", label: "MCP" },
        { id: "skills", label: "Skill Setup" },
        { id: "settings", label: "Settings" },
      ],
    },
  ];
}
