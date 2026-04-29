import type { LucideIcon } from "lucide-react";
import {
  AppWindowIcon,
  BlocksIcon,
  BracesIcon,
  CommandIcon,
  FileCogIcon,
  HammerIcon,
  PlayIcon,
  Settings2Icon,
  SparklesIcon,
  WrenchIcon,
  WorkflowIcon,
} from "lucide-react";

export type SidebarViewId =
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

export interface HeaderRouteItem extends SidebarItem {
  shortcut: number;
}

export const headerWorkflowItems: HeaderRouteItem[] = [
  { id: "processes", label: "Processes", shortcut: 1 },
  { id: "pipelines", label: "Pipelines", shortcut: 2 },
  { id: "scripts", label: "Scripts", shortcut: 3 },
  { id: "infrastructure", label: "Infrastructure", shortcut: 4 },
  { id: "project-config", label: "Project Config", shortcut: 5 },
];

export const workflowNavigationItems: SidebarItem[] = headerWorkflowItems.map(({ id, label }) => ({
  id,
  label,
}));

export const workflowSidebarItems = workflowNavigationItems;

export const systemSidebarItems: SidebarItem[] = [
  { id: "tool-status", label: "Tool Status" },
  { id: "mcp", label: "MCP" },
  { id: "skills", label: "Skill Setup" },
  { id: "settings", label: "Settings" },
];

export function getViewIcon(viewId: SidebarViewId): LucideIcon {
  if (viewId.startsWith("feature:")) {
    return CommandIcon;
  }

  switch (viewId) {
    case "pipelines":
      return WorkflowIcon;
    case "processes":
      return PlayIcon;
    case "scripts":
      return BracesIcon;
    case "infrastructure":
      return HammerIcon;
    case "tool-status":
      return WrenchIcon;
    case "project-config":
      return FileCogIcon;
    case "mcp":
      return BlocksIcon;
    case "skills":
      return SparklesIcon;
    case "settings":
      return Settings2Icon;
    default:
      return AppWindowIcon;
  }
}
