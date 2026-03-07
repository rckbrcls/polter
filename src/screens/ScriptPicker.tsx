import React, { useState, useEffect, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { inkColors, panel } from "../theme.js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { detectPkgManager, translateCommand } from "../lib/pkgManager.js";
import { startProcess, generateProcessId } from "../lib/processManager.js";
import { resolveToolCommand } from "../lib/toolResolver.js";
import { runCommand } from "../lib/runner.js";
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

interface ScriptEntry {
  name: string;
  command: string;
}

function readScripts(cwd: string): ScriptEntry[] {
  const pkgPath = join(cwd, "package.json");
  if (!existsSync(pkgPath)) return [];
  try {
    const raw = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const scripts: Record<string, string> = raw.scripts ?? {};
    return Object.entries(scripts).map(([name, command]) => ({ name, command }));
  } catch {
    return [];
  }
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
  const scripts = useMemo(() => readScripts(cwd), [cwd]);
  const mgr = useMemo(() => detectPkgManager(cwd), [cwd]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [feedback, setFeedback] = useState<string>();

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(undefined), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    if (selectedIndex >= scripts.length && scripts.length > 0) {
      setSelectedIndex(scripts.length - 1);
    }
  }, [scripts.length, selectedIndex]);

  useInput((input, key) => {
    if (!isInputActive) return;

    if (key.escape || (key.leftArrow && !key.ctrl)) {
      onBack();
      return;
    }

    if (scripts.length === 0) return;

    if (key.upArrow || input === "k") {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow || input === "j") {
      setSelectedIndex((i) => Math.min(scripts.length - 1, i + 1));
      return;
    }

    // Run in foreground
    if (key.return || key.rightArrow) {
      const script = scripts[selectedIndex];
      if (script) {
        const resolved = resolveToolCommand("pkg", cwd);
        try {
          const translated = translateCommand(["run", script.name], mgr.id);
          onNavigate("command-execution", {
            tool: "pkg",
            args: translated.args,
          });
        } catch {
          setFeedback(`"run" is not supported by ${mgr.id}`);
        }
      }
      return;
    }

    // Run in background
    if (input === "b") {
      const script = scripts[selectedIndex];
      if (script) {
        try {
          const translated = translateCommand(["run", script.name], mgr.id);
          const id = generateProcessId(mgr.command, translated.args);
          startProcess(id, mgr.command, translated.args, cwd);
          setFeedback(`Started ${mgr.id} run ${script.name} as background process`);
        } catch (err) {
          setFeedback(err instanceof Error ? err.message : "Failed to start process");
        }
      }
      return;
    }
  });

  const contentWidth = Math.max(30, (panelMode ? width - 4 : width) - 2);

  if (scripts.length === 0) {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        {!panelMode && (
          <Box marginBottom={1}>
            <Text bold color={inkColors.accent}>{"\uD83D\uDCDC"} {mgr.id} scripts</Text>
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
          <Text dimColor>No scripts found in package.json</Text>
        </Box>
        <Box marginTop={1} gap={2}>
          <Text dimColor>Esc:back</Text>
        </Box>
      </Box>
    );
  }

  const headerHeight = panelMode ? 0 : 2;
  const footerHeight = 2;
  const feedbackHeight = feedback ? 2 : 0;
  const availableHeight = height - headerHeight - footerHeight - feedbackHeight;
  const itemHeight = 1;
  const visibleCount = Math.max(1, Math.floor(availableHeight / itemHeight));
  const windowStart = Math.max(0, Math.min(selectedIndex - Math.floor(visibleCount / 2), scripts.length - visibleCount));
  const visibleScripts = scripts.slice(windowStart, windowStart + visibleCount);

  return (
    <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
      {!panelMode && (
        <Box marginBottom={1}>
          <Text bold color={inkColors.accent}>{"\uD83D\uDCDC"} {mgr.id} scripts</Text>
        </Box>
      )}

      {feedback && (
        <Box marginBottom={1}>
          <Text color={inkColors.accent}>{feedback}</Text>
        </Box>
      )}

      <Box flexDirection="column" width={contentWidth}>
        {visibleScripts.map((script) => {
          const idx = scripts.indexOf(script);
          const isFocused = idx === selectedIndex;

          return (
            <Box key={script.name} gap={1}>
              <Text color={isFocused ? inkColors.accent : undefined} bold={isFocused}>
                {isFocused ? "\u25B6" : " "} {script.name}
              </Text>
              <Text dimColor>{script.command}</Text>
            </Box>
          );
        })}
      </Box>

      {scripts.length > visibleCount && (
        <Box>
          <Text dimColor>
            {windowStart > 0 ? "\u25B2 " : "  "}
            {windowStart + visibleCount < scripts.length ? "\u25BC " : "  "}
            {scripts.length} scripts
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
