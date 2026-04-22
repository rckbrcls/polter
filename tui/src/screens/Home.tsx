import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import ms from "ms";
import { TabBar } from "../components/TabBar.js";
import { SelectList, type SelectItem } from "../components/SelectList.js";
import { StatusBar } from "../components/StatusBar.js";
import { inkColors } from "../theme.js";
import {
  getPinnedCommands,
  getPinnedRuns,
  togglePinnedCommand,
  togglePinnedRun,
} from "../data/pins.js";
import { getFeatures, buildHomeItems } from "./homeModel.js";
import { findCommandByValue } from "../data/commands/index.js";
import type { NavigationParams, Screen } from "../hooks/useNavigation.js";

interface HomeProps {
  onNavigate: (screen: Screen, params?: NavigationParams) => void;
  onExit: () => void;
  width?: number;
  height?: number;
}

export function Home({
  onNavigate,
  onExit,
  width = 80,
  height = 24,
}: HomeProps): React.ReactElement {
  const allFeatures = useMemo(() => getFeatures(), []);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [pinnedCommands, setPinnedCommands] = useState<string[]>(
    () => getPinnedCommands(),
  );
  const [pinnedRuns, setPinnedRuns] = useState<string[]>(
    () => getPinnedRuns(),
  );
  const [pinFeedback, setPinFeedback] = useState<string>();

  const activeFeature = allFeatures[activeTabIndex]!;

  useEffect(() => {
    if (!pinFeedback) return;
    const timeout = setTimeout(() => setPinFeedback(undefined), ms("1.4s"));
    return () => clearTimeout(timeout);
  }, [pinFeedback]);

  useInput((_input, key) => {
    if (key.leftArrow && !key.meta) {
      setActiveTabIndex((prev) =>
        prev > 0 ? prev - 1 : allFeatures.length - 1,
      );
    }
    if (key.rightArrow && !key.meta) {
      setActiveTabIndex((prev) =>
        prev < allFeatures.length - 1 ? prev + 1 : 0,
      );
    }
    if (key.tab) {
      setActiveTabIndex((prev) =>
        prev < allFeatures.length - 1 ? prev + 1 : 0,
      );
    }
  });

  const tabs = useMemo(
    () => allFeatures.map((f) => ({ id: f.id, icon: f.icon, label: f.label })),
    [allFeatures],
  );

  const items = useMemo(
    () =>
      buildHomeItems({
        activeFeature,
        pinnedCommands,
        pinnedRuns,
      }),
    [activeFeature, pinnedCommands, pinnedRuns],
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
      const cmdDef = findCommandByValue(value);
      if (cmdDef) {
        onNavigate("command-args", {
          command: value,
          commandId: cmdDef.id,
          tool: cmdDef.tool,
        });
      } else {
        // Legacy fallback for supabase commands
        onNavigate("command-args", { command: value, tool: "supabase" });
      }
      return;
    }

    if (item.kind === "run") {
      const args = value.split(" ").filter(Boolean);
      if (args.length > 0) {
        // Determine tool from the run command
        const basePart = args[0] ?? "";
        const cmdDef = findCommandByValue(basePart);
        const tool = cmdDef?.tool ?? "supabase";
        onNavigate("confirm-execute", { args, tool, interactive: cmdDef?.interactive });
      }
      return;
    }

    switch (value) {
      case "__action_custom__":
        onNavigate("custom-command");
        break;
      case "__action_pipelines__":
        onNavigate("pipeline-list");
        break;
      case "__action_tools__":
        onNavigate("tool-status");
        break;
      case "__action_config__":
        onNavigate("project-config");
        break;
      case "__action_skill_setup__":
        onNavigate("skill-setup");
        break;
      case "__action_update__":
        onNavigate("self-update");
        break;
      case "__action_declarative_plan__":
        onNavigate("declarative-plan");
        break;
      case "__action_declarative_status__":
        onNavigate("declarative-status");
        break;
      case "__action_init_scaffold__":
        onNavigate("init-scaffold");
        break;
      case "__action_exit__":
        onExit();
        break;
    }
  };

  const handleRightAction = (item: SelectItem) => {
    if (item.kind === "command") {
      const wasPinned = pinnedCommandSet.has(item.value);
      togglePinnedCommand(item.value);
      refreshPins();
      setPinFeedback(
        wasPinned ? `Unpinned "${item.value}"` : `Pinned "${item.value}"`,
      );
      return;
    }

    if (item.kind === "run") {
      const wasPinned = pinnedRunSet.has(item.value);
      togglePinnedRun(item.value);
      refreshPins();
      setPinFeedback(
        wasPinned
          ? `Unpinned run "${item.value}"`
          : `Pinned run "${item.value}"`,
      );
    }
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <TabBar tabs={tabs} activeIndex={activeTabIndex} width={width} />
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
        width={width}
        maxVisible={Math.max(8, height - 14)}
      />

      <StatusBar hint="←→ tab · ↑↓ navigate · Enter select · p pin" width={width} />
    </Box>
  );
}
