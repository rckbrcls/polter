import type { SelectItem } from "../components/SelectList.js";

export interface SuggestedArgOption {
  value: string;
  label: string;
  hint?: string;
  args: string[];
}

interface BuildCommandArgItemsParams {
  command: string;
  suggestions: SuggestedArgOption[];
  pinnedRuns: string[];
}

function buildRunCommand(command: string, extraArgs: string[]): string {
  return [command, ...extraArgs].join(" ");
}

export function getRunCommandFromArgsSelection(
  command: string,
  value: string,
  suggestions: SuggestedArgOption[],
): string | undefined {
  if (value === "__run_base__") {
    return command;
  }

  if (!value.startsWith("suggest:")) {
    return undefined;
  }

  const optionKey = value.replace("suggest:", "");
  const option = suggestions.find((entry) => entry.value === optionKey);
  if (!option) {
    return undefined;
  }

  return buildRunCommand(command, option.args);
}

export function buildCommandArgItems({
  command,
  suggestions,
  pinnedRuns,
}: BuildCommandArgItemsParams): SelectItem[] {
  const pinnedRunSet = new Set(pinnedRuns);
  const baseRunCommand = buildRunCommand(command, []);

  return [
    {
      value: "__suggested_header__",
      label: `Suggested args for ${command}`,
      kind: "header",
      selectable: false,
    },
    ...suggestions.map((option) => {
      const runCommand = buildRunCommand(command, option.args);
      const pinHint = pinnedRunSet.has(runCommand) ? "pinned run" : undefined;

      return {
        value: `suggest:${option.value}`,
        label: option.label,
        hint: [option.hint, pinHint].filter(Boolean).join(" · "),
        kind: "command" as const,
        rightActionable: true,
      };
    }),
    {
      value: "__actions_header__",
      label: "⚡ Actions",
      kind: "header",
      selectable: false,
    },
    {
      value: "__run_base__",
      label: "Run without additional args",
      hint: [
        `${command}`,
        pinnedRunSet.has(baseRunCommand) ? "pinned run" : undefined,
      ]
        .filter(Boolean)
        .join(" · "),
      kind: "action" as const,
      rightActionable: true,
    },
    {
      value: "__custom__",
      label: "Custom args...",
      hint: "Type any arguments manually",
      kind: "action" as const,
    },
  ];
}
