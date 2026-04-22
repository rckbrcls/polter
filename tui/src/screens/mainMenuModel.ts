import type { SelectItem } from "../components/SelectList.js";
import { categories } from "../data/commands.js";

interface CommandCatalogEntry {
  categoryIcon: string;
  categoryLabel: string;
  value: string;
  hint?: string;
}

const commandCatalog: CommandCatalogEntry[] = Object.entries(categories).flatMap(
  ([, category]) =>
    category.commands.map((command) => ({
      categoryIcon: category.icon,
      categoryLabel: category.label,
      value: command.value,
      hint: command.hint,
    })),
);

const commandInfoByValue = new Map(
  commandCatalog.map((entry) => [entry.value, entry]),
);

interface BuildMainMenuItemsParams {
  pinnedCommands: string[];
  pinnedRuns: string[];
}

function getCommandInfo(commandValue: string) {
  return commandInfoByValue.get(commandValue);
}

export function buildMainMenuItems({
  pinnedCommands,
  pinnedRuns,
}: BuildMainMenuItemsParams): SelectItem[] {
  const pinnedCommandSet = new Set(pinnedCommands);
  const nextItems: SelectItem[] = [];

  if (pinnedRuns.length > 0) {
    nextItems.push({
      id: "section-pinned-runs",
      value: "__section_pinned_runs__",
      label: "▶ Pinned Runs",
      kind: "header",
      selectable: false,
    });

    for (const runCommand of pinnedRuns) {
      const baseCommand = runCommand.split(" ").filter(Boolean)[0] ?? "";
      const info = getCommandInfo(baseCommand);
      const infoHint = info
        ? `${info.categoryIcon} ${info.categoryLabel} · exact pinned run`
        : "Exact pinned run";

      nextItems.push({
        id: `run:${runCommand}`,
        value: runCommand,
        label: runCommand,
        hint: infoHint,
        icon: "▶",
        kind: "run",
        rightActionable: true,
        section: "pinned-runs",
      });
    }
  }

  if (pinnedCommands.length > 0) {
    nextItems.push({
      id: "section-pinned-commands",
      value: "__section_pinned_commands__",
      label: "📌 Pinned Commands",
      kind: "header",
      selectable: false,
    });

    for (const command of pinnedCommands) {
      const info = getCommandInfo(command);
      const infoHint = info
        ? `${info.categoryIcon} ${info.categoryLabel}${info.hint ? ` · ${info.hint}` : ""}`
        : "Pinned command";

      nextItems.push({
        id: `command:${command}`,
        value: command,
        label: command,
        hint: infoHint,
        icon: "📌",
        kind: "command",
        rightActionable: true,
        section: "pinned-commands",
      });
    }
  }

  nextItems.push({
    id: "section-all-commands",
    value: "__section_all_commands__",
    label: "📂 All Commands",
    kind: "header",
    selectable: false,
  });

  for (const [categoryKey, category] of Object.entries(categories)) {
    nextItems.push({
      id: `category-${categoryKey}`,
      value: `__category_${categoryKey}__`,
      label: `${category.icon}  ${category.label}`,
      kind: "header",
      selectable: false,
    });

    for (const command of category.commands) {
      const pinHint = pinnedCommandSet.has(command.value) ? "pinned" : undefined;
      nextItems.push({
        id: `cmd-${categoryKey}-${command.value}`,
        value: command.value,
        label: command.label,
        hint: [command.hint, pinHint].filter(Boolean).join(" · "),
        kind: "command",
        rightActionable: true,
        section: categoryKey,
        groupLabel: category.label,
      });
    }
  }

  nextItems.push({
    id: "section-actions",
    value: "__section_actions__",
    label: "⚡ Actions",
    kind: "header",
    selectable: false,
  });

  nextItems.push({
    id: "action-custom",
    value: "__action_custom__",
    label: "Custom Command",
    hint: "Free-form args or check version",
    icon: "✏️",
    kind: "action",
  });
  nextItems.push({
    id: "action-update",
    value: "__action_update__",
    label: "Update Polter",
    hint: "Update the current repo install or the global install",
    icon: "⬆️",
    kind: "action",
  });
  nextItems.push({
    id: "action-exit",
    value: "__action_exit__",
    label: "Exit",
    icon: "🚪",
    kind: "action",
  });

  return nextItems;
}
