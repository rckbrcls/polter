import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { inkColors, panel } from "../theme.js";
import { listProcesses, stopProcess, removeProcess, type ProcessInfo } from "../lib/processManager.js";
import { homedir } from "node:os";
import type { Screen } from "../data/types.js";
import type { NavigationParams } from "../hooks/useNavigation.js";

interface ProcessListProps {
  onNavigate: (screen: Screen, params?: NavigationParams) => void;
  onBack: () => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatDuration(startedAt: string, exitedAt: string | null): string {
  if (!exitedAt) return "—";
  const ms = new Date(exitedAt).getTime() - new Date(startedAt).getTime();
  return formatUptime(ms);
}

function statusIcon(status: ProcessInfo["status"]): { icon: string; color: string } {
  switch (status) {
    case "running": return { icon: "\u25CF", color: "green" };
    case "exited": return { icon: "\u25CB", color: "gray" };
    case "errored": return { icon: "\u25CF", color: "red" };
  }
}

function shortenPath(p: string): string {
  const home = homedir();
  return p.startsWith(home) ? "~" + p.slice(home.length) : p;
}

const CARD_HEIGHT = 6; // 4 content lines + 2 border lines

export function ProcessList({
  onNavigate,
  onBack,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: ProcessListProps): React.ReactElement {
  const [processes, setProcesses] = useState<ProcessInfo[]>(() => listProcesses());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [feedback, setFeedback] = useState<string>();

  useEffect(() => {
    const interval = setInterval(() => {
      setProcesses(listProcesses());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(undefined), 2000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Clamp selected index when process list changes
  useEffect(() => {
    if (selectedIndex >= processes.length && processes.length > 0) {
      setSelectedIndex(processes.length - 1);
    }
  }, [processes.length, selectedIndex]);

  const handleStop = useCallback(async (id: string) => {
    try {
      await stopProcess(id);
      setProcesses(listProcesses());
      setFeedback(`Stopped: ${id}`);
    } catch (err) {
      setFeedback(`Error: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }, []);

  const handleRemove = useCallback((id: string) => {
    try {
      removeProcess(id);
      setProcesses(listProcesses());
      setFeedback(`Removed: ${id}`);
    } catch (err) {
      setFeedback(`Error: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }, []);

  useInput((input, key) => {
    if (!isInputActive) return;

    if (key.escape || (key.leftArrow && !key.ctrl)) {
      onBack();
      return;
    }

    if (processes.length === 0) return;

    // Navigation
    if (key.upArrow || input === "k") {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow || input === "j") {
      setSelectedIndex((i) => Math.min(processes.length - 1, i + 1));
      return;
    }

    // Drill into logs
    if (key.rightArrow || key.return) {
      const proc = processes[selectedIndex];
      if (proc) onNavigate("process-logs", { processId: proc.id });
      return;
    }

    // Stop running process
    if (input === "x") {
      const proc = processes[selectedIndex];
      if (proc?.status === "running") handleStop(proc.id);
      return;
    }

    // Remove exited process
    if (input === "d") {
      const proc = processes[selectedIndex];
      if (proc && proc.status !== "running") handleRemove(proc.id);
      return;
    }
  });

  const cardWidth = Math.max(30, (panelMode ? width - 4 : width) - 2);

  // Empty state
  if (processes.length === 0) {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        {!panelMode && (
          <Box marginBottom={1}>
            <Text bold color={inkColors.accent}>Processes</Text>
          </Box>
        )}
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={panel.borderDim}
          borderDimColor
          paddingX={1}
          width={cardWidth}
        >
          <Text dimColor>No tracked processes</Text>
          <Text dimColor>Start processes via MCP tools or CLI</Text>
        </Box>
        <Box marginTop={1} gap={2}>
          <Text dimColor>Esc:back</Text>
        </Box>
      </Box>
    );
  }

  // Compute visible window for scrolling
  const footerHeight = 2; // hint bar + gap
  const headerHeight = panelMode ? 0 : 2; // title + margin
  const feedbackHeight = feedback ? 2 : 0;
  const availableHeight = height - headerHeight - footerHeight - feedbackHeight;
  const visibleCards = Math.max(1, Math.floor(availableHeight / CARD_HEIGHT));
  const windowStart = Math.max(0, Math.min(selectedIndex - Math.floor(visibleCards / 2), processes.length - visibleCards));
  const visibleProcesses = processes.slice(windowStart, windowStart + visibleCards);

  return (
    <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
      {!panelMode && (
        <Box marginBottom={1}>
          <Text bold color={inkColors.accent}>Processes</Text>
        </Box>
      )}

      {feedback && (
        <Box marginBottom={1}>
          <Text color={inkColors.accent}>{feedback}</Text>
        </Box>
      )}

      {visibleProcesses.map((proc) => {
        const idx = processes.indexOf(proc);
        const isFocused = idx === selectedIndex;
        const si = statusIcon(proc.status);
        const pid = proc.pid ? String(proc.pid) : "\u2014";
        const uptimeOrExit = proc.status === "running"
          ? `UP   ${formatUptime(proc.uptime)}`
          : `EXIT ${proc.exitCode ?? "?"}        DURATION ${formatDuration(proc.startedAt, proc.exitedAt)}`;

        return (
          <Box
            key={proc.id}
            flexDirection="column"
            borderStyle="round"
            borderColor={isFocused ? inkColors.accent : panel.borderDim}
            borderDimColor={!isFocused}
            paddingX={1}
            width={cardWidth}
          >
            <Box justifyContent="space-between">
              <Text bold>{si.icon} {proc.id}</Text>
              <Text color={si.color}>{proc.status}</Text>
            </Box>
            <Text dimColor>  CMD  {proc.command} {proc.args.join(" ")}</Text>
            <Text dimColor>  PID  {pid}    CWD  {shortenPath(proc.cwd)}</Text>
            <Text dimColor>  {uptimeOrExit}</Text>
          </Box>
        );
      })}

      {processes.length > visibleCards && (
        <Box>
          <Text dimColor>{windowStart > 0 ? "\u25B2 " : "  "}{windowStart + visibleCards < processes.length ? "\u25BC " : "  "}{processes.length} processes</Text>
        </Box>
      )}

      <Box marginTop={1} gap={2}>
        <Text dimColor>{"\u2192"}:logs</Text>
        <Text dimColor>x:stop</Text>
        <Text dimColor>d:remove</Text>
        <Text dimColor>Esc:back</Text>
      </Box>
    </Box>
  );
}
