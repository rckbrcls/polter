import type { SelectItem } from "../components/SelectList.js";
import type { Feature } from "../data/types.js";
import { features } from "../data/features.js";
import { getCommandValue, findCommandByValue } from "../data/commands/index.js";
import { getToolDisplayName } from "../lib/toolResolver.js";

interface BuildHomeItemsParams {
  activeFeature: Feature;
  pinnedCommands: string[];
  pinnedRuns: string[];
  showPinnedSection?: boolean;
  showFeatureHeader?: boolean;
}

export function getFeatures(): Feature[] {
  return features;
}

export function buildPinnedOnlyItems(
  pinnedCommands: string[],
  pinnedRuns: string[],
): SelectItem[] {
  const items: SelectItem[] = [];

  if (pinnedCommands.length > 0) {
    for (const command of pinnedCommands) {
      const cmdDef = findCommandByValue(command);
      const toolDisplay = cmdDef ? getToolDisplayName(cmdDef.tool) : "supabase";
      const labelHint = cmdDef?.hint;

      items.push({
        id: `command:${command}`,
        value: command,
        label: cmdDef ? `${toolDisplay} ${command}` : command,
        hint: [toolDisplay, labelHint].filter(Boolean).join(" · "),
        icon: "📌",
        kind: "command",
        rightActionable: true,
        section: "pinned-commands",
      });
    }
  }

  if (pinnedRuns.length > 0) {
    for (const runCommand of pinnedRuns) {
      const baseCommand = runCommand.split(" ").filter(Boolean)[0] ?? "";
      const cmdDef = findCommandByValue(baseCommand);
      const toolDisplay = cmdDef ? getToolDisplayName(cmdDef.tool) : "supabase";

      items.push({
        id: `run:${runCommand}`,
        value: runCommand,
        label: cmdDef ? `${toolDisplay} ${runCommand}` : runCommand,
        hint: toolDisplay,
        icon: "▶",
        kind: "run",
        rightActionable: true,
        section: "pinned-runs",
      });
    }
  }

  return items;
}

export function buildHomeItems({
  activeFeature,
  pinnedCommands,
  pinnedRuns,
  showPinnedSection = true,
  showFeatureHeader = true,
}: BuildHomeItemsParams): SelectItem[] {
  const items: SelectItem[] = [];

  // Pinned section
  if (showPinnedSection && (pinnedRuns.length > 0 || pinnedCommands.length > 0)) {
    items.push({
      id: "section-pinned",
      value: "__section_pinned__",
      label: "📌 Pinned",
      kind: "header",
      selectable: false,
    });

    items.push(...buildPinnedOnlyItems(pinnedCommands, pinnedRuns));
  }

  // Commands for active feature, grouped by tool
  if (showFeatureHeader) {
    items.push({
      id: "section-commands",
      value: "__section_commands__",
      label: `📂 ${activeFeature.label} Commands`,
      kind: "header",
      selectable: false,
    });
  }

  const toolOrder: Record<string, number> = { supabase: 0, vercel: 1, gh: 2, git: 3, pkg: 4 };
  const toolIcons: Record<string, string> = { supabase: "🟢", vercel: "⚪", gh: "🔵", git: "🟠", pkg: "📦" };

  const grouped = new Map<string, typeof activeFeature.commands>();
  for (const cmd of activeFeature.commands) {
    const existing = grouped.get(cmd.tool) ?? [];
    existing.push(cmd);
    grouped.set(cmd.tool, existing);
  }

  const sortedTools = [...grouped.keys()].sort(
    (a, b) => (toolOrder[a] ?? 99) - (toolOrder[b] ?? 99),
  );

  for (const tool of sortedTools) {
    const cmds = grouped.get(tool)!;
    const icon = toolIcons[tool] ?? "⚪";

    items.push({
      id: `tool-header-${tool}`,
      value: `__tool_header_${tool}__`,
      label: `${icon} ${getToolDisplayName(tool as import("../data/types.js").CliToolId)}`,
      kind: "header",
      selectable: false,
    });

    for (const cmd of cmds) {
      const value = getCommandValue(cmd);
      const isPinned = pinnedCommands.includes(value);

      items.push({
        id: `cmd-${cmd.id}`,
        value,
        label: cmd.label,
        hint: [cmd.hint, isPinned ? "pinned" : undefined]
          .filter(Boolean)
          .join(" · "),
        kind: "command",
        rightActionable: true,
        section: activeFeature.id,
        groupLabel: tool,
      });
    }
  }

  // System section
  items.push({
    id: "section-system",
    value: "__section_system__",
    label: "\u2699\uFE0F System",
    kind: "header",
    selectable: false,
  });

  items.push({
    id: "action-declarative-plan",
    value: "__action_declarative_plan__",
    label: "Plan / Apply",
    hint: "Declarative infrastructure",
    kind: "action",
  });

  items.push({
    id: "action-declarative-status",
    value: "__action_declarative_status__",
    label: "Infra Status",
    hint: "Live state from CLI tools",
    kind: "action",
  });

  items.push({
    id: "action-init-scaffold",
    value: "__action_init_scaffold__",
    label: "Init polter.yaml",
    hint: "Generate from detected state",
    kind: "action",
  });

  items.push({
    id: "action-pipelines",
    value: "__action_pipelines__",
    label: "Pipelines",
    hint: "Multi-step workflows",
    kind: "action",
  });

  items.push({
    id: "action-tools",
    value: "__action_tools__",
    label: "Tool Status",
    hint: "Check installed CLI tools",
    kind: "action",
  });

  items.push({
    id: "action-config",
    value: "__action_config__",
    label: "Project Config",
    hint: "Tool refs and settings",
    kind: "action",
  });

  items.push({
    id: "action-custom",
    value: "__action_custom__",
    label: "Custom Command",
    hint: "Free-form args",
    kind: "action",
  });

  items.push({
    id: "action-skill-setup",
    value: "__action_skill_setup__",
    label: "Skill Setup",
    hint: "Install Claude Code skill",
    kind: "action",
  });

  items.push({
    id: "action-update",
    value: "__action_update__",
    label: "Update Polter",
    kind: "action",
  });

  items.push({
    id: "action-exit",
    value: "__action_exit__",
    label: "Exit",
    kind: "action",
  });

  return items;
}
