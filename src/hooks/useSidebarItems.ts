import { useMemo } from "react";
import { features } from "../data/features.js";

export type SidebarSection = "workflows" | "features" | "system";

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  type: "feature" | "action" | "separator";
  section?: SidebarSection;
  sectionTitle?: string;
}

export function useSidebarItems(): SidebarItem[] {
  return useMemo(() => {
    const items: SidebarItem[] = [];

    // Section 1: Workflows
    items.push({ id: "__sep_workflows__", label: "---", icon: "", type: "separator", sectionTitle: "Workflows" });
    items.push({ id: "pipelines", label: "Pipelines", icon: "\uD83D\uDD17", type: "action", section: "workflows" });
    items.push({ id: "pinned", label: "Pinned", icon: "\uD83D\uDCCC", type: "action", section: "workflows" });
    items.push({ id: "custom-command", label: "Custom Cmd", icon: "\u270F\uFE0F", type: "action", section: "workflows" });
    items.push({ id: "processes", label: "Processes", icon: "\uD83D\uDCBB", type: "action", section: "workflows" });
    items.push({ id: "scripts", label: "Scripts", icon: "\uD83D\uDCDC", type: "action", section: "workflows" });

    // Section 2: Features
    items.push({ id: "__sep_features__", label: "---", icon: "", type: "separator", sectionTitle: "Features" });
    for (const feature of features) {
      items.push({
        id: feature.id,
        label: feature.label,
        icon: feature.icon,
        type: "feature",
        section: "features",
      });
    }

    // Section 3: System
    items.push({ id: "__sep_system__", label: "---", icon: "", type: "separator", sectionTitle: "System" });
    items.push({ id: "declarative", label: "Infrastructure", icon: "\uD83C\uDFD7\uFE0F", type: "action", section: "system" });
    items.push({ id: "tool-status", label: "Tool Status", icon: "\uD83D\uDD27", type: "action", section: "system" });
    items.push({ id: "config", label: "Config", icon: "\u2699\uFE0F", type: "action", section: "system" });
    items.push({ id: "self-update", label: "Update", icon: "\u2B06\uFE0F", type: "action", section: "system" });

    return items;
  }, []);
}
