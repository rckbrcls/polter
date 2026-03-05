import React, { useEffect, useMemo, useState } from "react";
import { Box, Text } from "ink";
import { GhostBanner } from "../components/GhostBanner.js";
import { SelectList, type SelectItem } from "../components/SelectList.js";
import { StatusBar } from "../components/StatusBar.js";
import { inkColors } from "../theme.js";
import {
  getPinnedCommands,
  getPinnedRuns,
  togglePinnedCommand,
  togglePinnedRun,
} from "../data/pins.js";
import { buildMainMenuItems } from "./mainMenuModel.js";
import type { NavigationParams, Screen } from "../hooks/useNavigation.js";

interface MainMenuProps {
  onNavigate: (screen: Screen, params?: NavigationParams) => void;
  onExit: () => void;
}

export function MainMenu({
  onNavigate,
  onExit,
}: MainMenuProps): React.ReactElement {
  const [pinnedCommands, setPinnedCommands] = useState<string[]>(
    () => getPinnedCommands(),
  );
  const [pinnedRuns, setPinnedRuns] = useState<string[]>(
    () => getPinnedRuns(),
  );
  const [pinFeedback, setPinFeedback] = useState<string>();

  useEffect(() => {
    if (!pinFeedback) return;
    const timeout = setTimeout(() => setPinFeedback(undefined), 1400);
    return () => clearTimeout(timeout);
  }, [pinFeedback]);

  const items = useMemo(
    () =>
      buildMainMenuItems({
        pinnedCommands,
        pinnedRuns,
      }),
    [pinnedCommands, pinnedRuns],
  );
  const pinnedCommandSet = useMemo(
    () => new Set(pinnedCommands),
    [pinnedCommands],
  );
  const pinnedRunSet = useMemo(() => new Set(pinnedRuns), [pinnedRuns]);

  const refreshPins = () => {
    setPinnedCommands(getPinnedCommands());
    setPinnedRuns(getPinnedRuns());
  };

  const handleSelect = (value: string, item?: SelectItem) => {
    if (!item) return;

    if (item.kind === "command") {
      onNavigate("command-args", { command: value });
      return;
    }

    if (item.kind === "run") {
      const args = value.split(" ").filter(Boolean);
      if (args.length > 0) {
        onNavigate("confirm-execute", { args });
      }
      return;
    }

    if (value === "__action_custom__") {
      onNavigate("custom-command");
      return;
    }

    if (value === "__action_exit__") {
      onExit();
    }
  };

  const handleRightAction = (item: SelectItem) => {
    if (item.kind === "command") {
      const command = item.value;
      const wasPinned = pinnedCommandSet.has(command);
      togglePinnedCommand(command);
      refreshPins();
      setPinFeedback(
        wasPinned ? `Unpinned "${command}"` : `Pinned "${command}"`,
      );
      return;
    }

    if (item.kind === "run") {
      const runCommand = item.value;
      const wasPinned = pinnedRunSet.has(runCommand);
      togglePinnedRun(runCommand);
      refreshPins();
      setPinFeedback(
        wasPinned
          ? `Unpinned exact run "${runCommand}"`
          : `Pinned exact run "${runCommand}"`,
      );
    }
  };

  return (
    <Box flexDirection="column">
      <GhostBanner />

      <Box marginBottom={1}>
        <Text bold>Choose a command, then press Enter to continue.</Text>
      </Box>

      {pinFeedback && (
        <Box marginBottom={1}>
          <Text color={inkColors.accent}>✓ {pinFeedback}</Text>
        </Box>
      )}

      <SelectList
        items={items}
        onSelect={handleSelect}
        onRightAction={handleRightAction}
        boxedSections
      />

      <StatusBar hint="↑↓ navigate · Enter select · → pin/unpin · Esc back" />
    </Box>
  );
}
