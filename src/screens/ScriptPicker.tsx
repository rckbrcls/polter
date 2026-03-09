import React, { useState, useEffect, useMemo } from "react";
import { basename } from "node:path";
import { Box, Text, useInput } from "ink";
import ms from "ms";
import { inkColors, panel } from "../theme.js";
import { readScripts, discoverChildRepos, type ChildRepo } from "../lib/childRepos.js";
import { detectPkgManager, translateCommand } from "../lib/pkgManager.js";
import { startProcess, generateProcessId } from "../lib/processManager.js";
import { readProjectConfig } from "../config/projectConfig.js";
import type { Screen } from "../data/types.js";
import type { NavigationParams } from "../hooks/useNavigation.js";

interface ScriptPickerProps {
  onNavigate: (screen: Screen, params?: NavigationParams) => void;
  onBack: () => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

interface FlatItem {
  kind: "header" | "script";
  group: string;
  repoPath?: string;
  scriptName?: string;
  scriptCommand?: string;
  pkgManagerCommand?: string;
  pkgManagerId?: string;
}

function buildLocalItems(
  scripts: { name: string; command: string }[],
  projectName: string,
  mgr: { command: string; id: string },
): FlatItem[] {
  if (scripts.length === 0) return [];
  const items: FlatItem[] = [{ kind: "header", group: projectName }];
  for (const s of scripts) {
    items.push({
      kind: "script",
      group: projectName,
      scriptName: s.name,
      scriptCommand: s.command,
      pkgManagerCommand: mgr.command,
      pkgManagerId: mgr.id,
    });
  }
  return items;
}

function buildChildItems(repos: ChildRepo[]): FlatItem[] {
  const items: FlatItem[] = [];
  for (const repo of repos) {
    items.push({ kind: "header", group: repo.name });
    for (const script of repo.scripts) {
      items.push({
        kind: "script",
        group: repo.name,
        repoPath: repo.path,
        scriptName: script.name,
        scriptCommand: script.command,
        pkgManagerCommand: repo.pkgManager.command,
        pkgManagerId: repo.pkgManager.id,
      });
    }
  }
  return items;
}

export function ScriptPicker({
  onNavigate,
  onBack,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: ScriptPickerProps): React.ReactElement {
  const cwd = process.cwd();
  const [scripts, setScripts] = useState<ReturnType<typeof readScripts>>([]);
  const [mgr, setMgr] = useState<ReturnType<typeof detectPkgManager> | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [feedback, setFeedback] = useState<string>();
  const [config, setConfig] = useState<ReturnType<typeof readProjectConfig> | undefined>(undefined);

  useEffect(() => {
    setScripts(readScripts(cwd));
    setMgr(detectPkgManager(cwd));
    setConfig(readProjectConfig(cwd));
  }, [cwd]);

  const childRepos = useMemo(
    () => discoverChildRepos(cwd, config?.childRepos),
    [cwd, config?.childRepos],
  );

  const projectName = useMemo(() => {
    try {
      const raw = JSON.parse(require("node:fs").readFileSync(require("node:path").join(cwd, "package.json"), "utf-8"));
      return raw.name || basename(cwd);
    } catch {
      return basename(cwd);
    }
  }, [cwd]);

  const allItems = useMemo(() => {
    if (!mgr) return [];
    return [...buildLocalItems(scripts, projectName, mgr), ...buildChildItems(childRepos)];
  }, [scripts, mgr, projectName, childRepos]);

  const selectableIndices = useMemo(
    () => allItems.map((item, i) => (item.kind === "script" ? i : -1)).filter((i) => i >= 0),
    [allItems],
  );

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(undefined), ms("3s"));
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    if (selectedIndex >= selectableIndices.length && selectableIndices.length > 0) {
      setSelectedIndex(selectableIndices.length - 1);
    }
  }, [selectableIndices.length, selectedIndex]);

  useInput((input, key) => {
    if (!isInputActive) return;

    if (key.escape || (key.leftArrow && !key.ctrl)) {
      onBack();
      return;
    }

    if (selectableIndices.length === 0) return;

    if (key.upArrow || input === "k") {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow || input === "j") {
      setSelectedIndex((i) => Math.min(selectableIndices.length - 1, i + 1));
      return;
    }

    const flatIdx = selectableIndices[selectedIndex];
    const item = flatIdx !== undefined ? allItems[flatIdx] : undefined;
    if (!item || item.kind !== "script") return;

    if (key.return || key.rightArrow) {
      try {
        const translated = translateCommand(["run", item.scriptName!], item.pkgManagerId! as any);
        onNavigate("command-execution", {
          tool: "pkg",
          args: translated.args,
          cwd: item.repoPath,
        });
      } catch {
        setFeedback(`"run" is not supported by ${item.pkgManagerId}`);
      }
      return;
    }

    if (input === "b") {
      try {
        const translated = translateCommand(["run", item.scriptName!], item.pkgManagerId! as any);
        const id = generateProcessId(item.pkgManagerCommand!, translated.args);
        startProcess(id, item.pkgManagerCommand!, translated.args, item.repoPath || cwd);
        const location = item.repoPath ? ` in ${item.group}` : "";
        setFeedback(`Started ${item.pkgManagerId} run ${item.scriptName}${location} as background process`);
      } catch (err) {
        setFeedback(err instanceof Error ? err.message : "Failed to start process");
      }
      return;
    }
  });

  if (!mgr) {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Text color={inkColors.accent}>Loading...</Text>
      </Box>
    );
  }

  const contentWidth = Math.max(30, (panelMode ? width - 4 : width) - 2);

  // Empty state
  if (selectableIndices.length === 0) {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        {!panelMode && (
          <Box marginBottom={1}>
            <Text bold color={inkColors.accent}>{"\uD83D\uDCDC"} scripts</Text>
          </Box>
        )}
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={panel.borderDim}
          borderDimColor
          paddingX={1}
          width={contentWidth}
        >
          <Text dimColor>No scripts found</Text>
        </Box>
        <Box marginTop={1} gap={2}>
          <Text dimColor>Esc:back</Text>
        </Box>
      </Box>
    );
  }

  // Group items by their group name for rendering in boxes
  const groups: { name: string; items: FlatItem[]; flatStartIdx: number }[] = [];
  let currentGroup: (typeof groups)[number] | null = null;
  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    if (item.kind === "header") {
      currentGroup = { name: item.group, items: [], flatStartIdx: i };
      groups.push(currentGroup);
    } else if (currentGroup) {
      currentGroup.items.push(item);
    }
  }

  // Determine which group the currently focused item belongs to
  const focusedFlatIdx = selectableIndices[selectedIndex] ?? -1;
  const focusedGroup = allItems[focusedFlatIdx]?.group;

  // Viewport scrolling
  const headerHeight = panelMode ? 0 : 2;
  const footerHeight = 2;
  const feedbackHeight = feedback ? 2 : 0;
  const availableHeight = height - headerHeight - footerHeight - feedbackHeight;

  // Compute total render lines (each group = 2 border lines + scripts + 1 gap except first)
  const totalLines = groups.reduce((sum, g, gi) => sum + g.items.length + 2 + (gi > 0 ? 1 : 0), 0);
  const needsScroll = totalLines > availableHeight;

  return (
    <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
      {!panelMode && (
        <Box marginBottom={1}>
          <Text bold color={inkColors.accent}>{"\uD83D\uDCDC"} scripts</Text>
        </Box>
      )}

      {feedback && (
        <Box marginBottom={1}>
          <Text color={inkColors.accent}>{feedback}</Text>
        </Box>
      )}

      <Box flexDirection="column" width={contentWidth}>
        {groups.map((group, gi) => {
          const isFocusedGroup = group.name === focusedGroup;
          return (
            <Box
              key={group.name}
              flexDirection="column"
              borderStyle="round"
              borderColor={isFocusedGroup ? inkColors.accent : panel.borderDim}
              borderDimColor={!isFocusedGroup}
              paddingX={1}
              marginTop={gi > 0 ? 1 : 0}
            >
              <Text bold color={isFocusedGroup ? inkColors.accent : undefined}>{group.name}</Text>
              {group.items.map((item) => {
                const flatIdx = allItems.indexOf(item);
                const selectIdx = selectableIndices.indexOf(flatIdx);
                const isFocused = selectIdx === selectedIndex;

                return (
                  <Box key={`${item.group}-${item.scriptName}`} gap={1}>
                    <Text color={isFocused ? inkColors.accent : undefined} bold={isFocused}>
                      {isFocused ? "\u25B6" : " "} {item.scriptName}
                    </Text>
                    <Text dimColor>{item.scriptCommand}</Text>
                  </Box>
                );
              })}
            </Box>
          );
        })}
      </Box>

      {needsScroll && (
        <Box>
          <Text dimColor>
            {selectableIndices.length} scripts in {groups.length} {groups.length === 1 ? "project" : "projects"}
          </Text>
        </Box>
      )}

      <Box marginTop={1} gap={2}>
        <Text dimColor>{"\u21B5"}:run</Text>
        <Text dimColor>b:background</Text>
        <Text dimColor>Esc:back</Text>
      </Box>
    </Box>
  );
}
