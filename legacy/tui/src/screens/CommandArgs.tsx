import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import ms from "ms";
import { SelectList } from "../components/SelectList.js";
import { TextPrompt } from "../components/TextPrompt.js";
import { ToolBadge } from "../components/ToolBadge.js";
import { StatusBar } from "../components/StatusBar.js";
import { getPinnedRuns, togglePinnedRun } from "../data/pins.js";
import { findCommandByValue } from "../data/commands/index.js";
import {
  buildCommandArgItems,
  getRunCommandFromArgsSelection,
} from "./commandArgsModel.js";
import type { NavigationParams, Screen } from "../hooks/useNavigation.js";
import type { CliToolId, SuggestedArg } from "../data/types.js";
import { inkColors } from "../theme.js";

interface CommandArgsProps {
  command: string;
  tool?: CliToolId;
  onNavigate: (screen: Screen, params?: NavigationParams) => void;
  onBack: () => void;
  width?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type Phase = "select" | "custom";

export function CommandArgs({
  command,
  tool,
  onNavigate,
  onBack,
  width = 80,
  panelMode = false,
  isInputActive = true,
}: CommandArgsProps): React.ReactElement {
  const cmdDef = useMemo(() => findCommandByValue(command), [command]);
  const resolvedTool = tool ?? cmdDef?.tool ?? "supabase";
  const suggestions: SuggestedArg[] = useMemo(
    () => cmdDef?.suggestedArgs ?? [],
    [cmdDef],
  );

  const [pinnedRuns, setPinnedRuns] = useState<string[]>([]);

  useEffect(() => {
    setPinnedRuns(getPinnedRuns());
  }, []);
  const [pinFeedback, setPinFeedback] = useState<string>();
  const [phase, setPhase] = useState<Phase>(
    suggestions.length > 0 ? "select" : "custom",
  );

  useEffect(() => {
    setPhase(suggestions.length > 0 ? "select" : "custom");
  }, [command, suggestions.length]);

  useEffect(() => {
    if (!pinFeedback) return;
    const timeout = setTimeout(() => setPinFeedback(undefined), ms("1.4s"));
    return () => clearTimeout(timeout);
  }, [pinFeedback]);

  const navigateWithExtraArgs = (extraArgs: string[]) => {
    const baseArgs = cmdDef ? cmdDef.base : [command];
    onNavigate("flag-selection", {
      args: [...baseArgs, ...extraArgs],
      command,
      tool: resolvedTool,
      interactive: cmdDef?.interactive,
    });
  };

  useInput((_input, key) => {
    if (!command && (key.escape || key.leftArrow)) {
      onBack();
    }
  }, { isActive: isInputActive && !command });

  if (!command) {
    return (
      <Box flexDirection="column">
        <Text color="red">Command not provided.</Text>
        <Text dimColor>Press Esc or ← to go back</Text>
      </Box>
    );
  }

  if (phase === "custom") {
    const toolLabel = resolvedTool === "supabase" ? "supabase" : resolvedTool;
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Box marginBottom={1} gap={1}>
          <Text color={inkColors.accent} bold>
            Command
          </Text>
          <Text>{command}</Text>
          <ToolBadge tool={resolvedTool} />
        </Box>

        <TextPrompt
          label={`Additional args for ${toolLabel} ${command}?`}
          placeholder="e.g. list, pull, push (Enter to skip)"
          onSubmit={(extra) => {
            const extraArgs = extra
              .trim()
              .split(" ")
              .filter(Boolean);
            navigateWithExtraArgs(extraArgs);
          }}
          onCancel={() => {
            if (suggestions.length > 0) {
              setPhase("select");
              return;
            }
            onBack();
          }}
          arrowNavigation={panelMode}
          isInputActive={isInputActive}
          boxed={panelMode}
          focused={isInputActive}
        />

        {!panelMode && <StatusBar hint="Type args · Enter to continue · Esc to go back" width={width} />}
      </Box>
    );
  }

  // Map SuggestedArg[] to the legacy format expected by buildCommandArgItems
  const legacySuggestions = suggestions.map((s) => ({
    value: s.value,
    label: s.label,
    hint: s.hint,
    args: s.args,
  }));

  const items = useMemo(
    () =>
      buildCommandArgItems({
        command,
        suggestions: legacySuggestions,
        pinnedRuns,
      }),
    [command, legacySuggestions, pinnedRuns],
  );

  return (
    <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
      <Box marginBottom={1} gap={1}>
        <Text color={inkColors.accent} bold>
          Command
        </Text>
        <Text>{command}</Text>
        <ToolBadge tool={resolvedTool} />
      </Box>

      {pinFeedback && (
        <Box marginBottom={1}>
          <Text color={inkColors.accent}>✓ {pinFeedback}</Text>
        </Box>
      )}

      <SelectList
        items={items}
        onSelect={(value) => {
          if (value === "__back__") {
            onBack();
            return;
          }

          if (value === "__custom__") {
            setPhase("custom");
            return;
          }

          if (value === "__run_base__") {
            navigateWithExtraArgs([]);
            return;
          }

          if (value.startsWith("suggest:")) {
            const runCommand = getRunCommandFromArgsSelection(
              command,
              value,
              legacySuggestions,
            );
            if (runCommand) {
              navigateWithExtraArgs(
                runCommand
                  .split(" ")
                  .slice(1)
                  .filter(Boolean),
              );
            }
            return;
          }
        }}
        onRightAction={(item) => {
          const runCommand = getRunCommandFromArgsSelection(
            command,
            item.value,
            legacySuggestions,
          );
          if (!runCommand) {
            return;
          }

          const wasPinned = pinnedRuns.includes(runCommand);
          togglePinnedRun(runCommand);
          setPinnedRuns(getPinnedRuns());
          setPinFeedback(
            wasPinned
              ? `Unpinned exact run "${runCommand}"`
              : `Pinned exact run "${runCommand}"`,
          );
        }}
        onCancel={onBack}
        boxedSections
        width={panelMode ? Math.max(20, width - 4) : width}
        isInputActive={isInputActive}
        arrowNavigation={panelMode}
        panelFocused={isInputActive}
      />

      {!panelMode && <StatusBar hint="↑↓ navigate · Enter select · p pin · Esc back" width={width} />}
    </Box>
  );
}
