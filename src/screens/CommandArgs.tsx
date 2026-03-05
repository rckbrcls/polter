import React, { useEffect, useMemo, useState } from "react";
import { Box, Text } from "ink";
import { SelectList } from "../components/SelectList.js";
import { TextPrompt } from "../components/TextPrompt.js";
import { StatusBar } from "../components/StatusBar.js";
import { getPinnedRuns, togglePinnedRun } from "../data/pins.js";
import { getSuggestedArgOptions } from "../data/suggestedArgs.js";
import {
  buildCommandArgItems,
  getRunCommandFromArgsSelection,
} from "./commandArgsModel.js";
import type { NavigationParams, Screen } from "../hooks/useNavigation.js";
import { inkColors } from "../theme.js";

interface CommandArgsProps {
  command: string;
  onNavigate: (screen: Screen, params?: NavigationParams) => void;
  onBack: () => void;
}

type Phase = "select" | "custom";

export function CommandArgs({
  command,
  onNavigate,
  onBack,
}: CommandArgsProps): React.ReactElement {
  const suggestions = useMemo(() => getSuggestedArgOptions(command), [command]);
  const [pinnedRuns, setPinnedRuns] = useState<string[]>(() => getPinnedRuns());
  const [pinFeedback, setPinFeedback] = useState<string>();
  const [phase, setPhase] = useState<Phase>(
    suggestions.length > 0 ? "select" : "custom",
  );

  useEffect(() => {
    setPhase(suggestions.length > 0 ? "select" : "custom");
  }, [command, suggestions.length]);

  useEffect(() => {
    if (!pinFeedback) return;
    const timeout = setTimeout(() => setPinFeedback(undefined), 1400);
    return () => clearTimeout(timeout);
  }, [pinFeedback]);

  const navigateWithExtraArgs = (extraArgs: string[]) => {
    onNavigate("flag-selection", {
      args: [command, ...extraArgs],
      command,
    });
  };

  if (!command) {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="red">Command not provided.</Text>
        </Box>
        <SelectList
          items={[{ value: "__back__", label: "← Back to menu" }]}
          onSelect={onBack}
          onCancel={onBack}
        />
      </Box>
    );
  }

  if (phase === "custom") {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1} gap={1}>
          <Text color={inkColors.accent} bold>
            Command
          </Text>
          <Text>{command}</Text>
        </Box>

        <TextPrompt
          label={`Additional args for supabase ${command}?`}
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
        />

        <StatusBar hint="Type args · Enter to continue · Esc to go back" />
      </Box>
    );
  }

  const items = useMemo(
    () =>
      buildCommandArgItems({
        command,
        suggestions,
        pinnedRuns,
      }),
    [command, pinnedRuns, suggestions],
  );

  return (
    <Box flexDirection="column">
      <Box marginBottom={1} gap={1}>
        <Text color={inkColors.accent} bold>
          Command
        </Text>
        <Text>{command}</Text>
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
              suggestions,
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
            suggestions,
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
      />

      <StatusBar hint="↑↓ navigate · Enter select · → pin run · Esc back" />
    </Box>
  );
}
