import type { SelectItem } from "../components/SelectList.js";
import type { Feature } from "../data/types.js";
import { features } from "../data/features.js";
import { getCommandValue, findCommandByValue } from "../data/commands/index.js";

interface BuildHomeItemsParams {
  activeFeature: Feature;
  pinnedCommands: string[];
  pinnedRuns: string[];
  showPinnedSection?: boolean;
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
    items.push({
      id: "pinned-commands-header",
      value: "__pinned_commands_header__",
      label: "📌 Commands",
      kind: "header",
      selectable: false,
    });

    for (const command of pinnedCommands) {
      const cmdDef = findCommandByValue(command);
      const toolHint = cmdDef ? cmdDef.tool : "supabase";
      const labelHint = cmdDef?.hint;

      items.push({
        id: `command:${command}`,
        value: command,
        label: command,
        hint: [toolHint, labelHint].filter(Boolean).join(" · "),
        icon: "📌",
        kind: "command",
        rightActionable: true,
        section: "pinned-commands",
      });
    }
  }

  if (pinnedRuns.length > 0) {
    items.push({
      id: "pinned-runs-header",
      value: "__pinned_runs_header__",
      label: "▶ Pipelines",
      kind: "header",
      selectable: false,
    });

    for (const runCommand of pinnedRuns) {
      const baseCommand = runCommand.split(" ").filter(Boolean)[0] ?? "";
      const cmdDef = findCommandByValue(baseCommand);
      const toolHint = cmdDef ? cmdDef.tool : "supabase";

      items.push({
        id: `run:${runCommand}`,
        value: runCommand,
        label: runCommand,
        hint: toolHint,
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
  items.push({
    id: "section-commands",
    value: "__section_commands__",
    label: `📂 ${activeFeature.label} Commands`,
    kind: "header",
    selectable: false,
  });

  const toolOrder: Record<string, number> = { supabase: 0, vercel: 1, gh: 2, git: 3 };
  const toolIcons: Record<string, string> = { supabase: "🟢", vercel: "⚪", gh: "🔵", git: "🟠" };

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
      label: `${icon} ${tool}`,
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

  return items;
}
