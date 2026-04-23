import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { SelectList, type SelectItem } from "./SelectList.js";
import { inkColors } from "../theme.js";
import { usePinAction } from "../hooks/usePinAction.js";
import { buildPinnedOnlyItems } from "../screens/homeModel.js";
import { findCommandByValue } from "../data/commands/index.js";
import type { NavigationParams, Screen } from "../hooks/useNavigation.js";

interface PinnedCommandsProps {
  onNavigate: (screen: Screen, params?: NavigationParams) => void;
  onBack?: () => void;
  onPinsChanged?: () => void;
  width?: number;
  height?: number;
  isInputActive?: boolean;
}

export function PinnedCommands({
  onNavigate,
  onBack,
  onPinsChanged,
  width = 80,
  height = 24,
  isInputActive = true,
}: PinnedCommandsProps): React.ReactElement {
  const {
    pinnedCommands,
    pinnedRuns,
    pinFeedback,
    handleRightAction,
  } = usePinAction(onPinsChanged);

  const items = useMemo(
    () => buildPinnedOnlyItems(pinnedCommands, pinnedRuns),
    [pinnedCommands, pinnedRuns],
  );

  const handleSelect = (value: string, item?: SelectItem) => {
    if (!item) return;

    if (item.kind === "command") {
      const cmdDef = findCommandByValue(value);
      if (cmdDef) {
        onNavigate("command-args", {
          command: value,
          commandId: cmdDef.id,
          tool: cmdDef.tool,
        });
      } else {
        onNavigate("command-args", { command: value, tool: "supabase" });
      }
      return;
    }

    if (item.kind === "run") {
      const args = value.split(" ").filter(Boolean);
      if (args.length > 0) {
        const basePart = args[0] ?? "";
        const cmdDef = findCommandByValue(basePart);
        const tool = cmdDef?.tool ?? "supabase";
        onNavigate("confirm-execute", { args, tool, interactive: cmdDef?.interactive });
      }
    }
  };

  if (items.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color="gray">
          No pinned items. Press p on any command to pin it.
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
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
        width={Math.max(20, width - 4)}
        maxVisible={Math.max(6, height - 6)}
        onCancel={onBack}
        isInputActive={isInputActive}
        arrowNavigation
        panelFocused={isInputActive}
      />
    </Box>
  );
}
