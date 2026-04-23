import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import ms from "ms";
import { inkColors } from "../theme.js";
import { getProcessOutput, listProcesses, stopProcess, startProcess, generateProcessId, type ProcessInfo } from "../lib/processManager.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { TerminalBox } from "../components/TerminalBox.js";

interface ProcessLogsProps {
  processId: string;
  onBack: () => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type StreamFilter = "both" | "stdout" | "stderr";

export function ProcessLogs({
  processId,
  onBack,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: ProcessLogsProps): React.ReactElement {
  const [stream, setStream] = useState<StreamFilter>("both");
  const [lines, setLines] = useState<string[]>([]);
  const [proc, setProc] = useState<ProcessInfo | undefined>();
  const [feedback, setFeedback] = useState<string>();

  // Header (1) + gap (1) + border (2) + footer gap (1) + footer (1) = 6
  const logBoxHeight = Math.max(3, height - 6);

  useEffect(() => {
    const refresh = () => {
      try {
        const output = getProcessOutput(processId, 1000, stream);
        const combined = stream === "stderr"
          ? output.stderr
          : stream === "stdout"
            ? output.stdout
            : [...output.stdout, ...output.stderr].slice(-1000);
        setLines(combined);
      } catch {
        setLines([`Process "${processId}" not found`]);
      }

      const all = listProcesses();
      setProc(all.find((p) => p.id === processId));
    };

    refresh();
    const interval = setInterval(refresh, ms("1s"));
    return () => clearInterval(interval);
  }, [processId, stream]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(undefined), ms("2s"));
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleStop = useCallback(async () => {
    try {
      await stopProcess(processId);
      setFeedback("Stopped");
    } catch (err) {
      setFeedback(`Error: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }, [processId]);

  useInput((input, key) => {
    if (!isInputActive) return;

    if (key.escape || (key.leftArrow && !key.ctrl)) {
      onBack();
      return;
    }

    if (input === "s") {
      setStream((prev) => {
        if (prev === "both") return "stdout";
        if (prev === "stdout") return "stderr";
        return "both";
      });
      return;
    }

    if (input === "x") {
      if (proc?.status === "running") void handleStop();
      return;
    }

    if (input === "r") {
      if (proc) {
        const newId = generateProcessId(proc.command, proc.args);
        startProcess(newId, proc.command, proc.args, proc.cwd);
        setFeedback(`Re-started: ${newId}`);
      }
      return;
    }
  });

  const statusColor = proc?.status === "running" ? "green" : proc?.status === "errored" ? "red" : "gray";
  const statusIcon = proc?.status === "running" ? "\u25CF" : "\u25CB";
  const cardWidth = Math.max(30, (panelMode ? width - 4 : width) - 2);

  return (
    <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
      {/* Header */}
      <Box marginBottom={1} gap={2}>
        <Text bold color={inkColors.accent}>{processId}</Text>
        <Text color={statusColor}>{statusIcon} {proc?.status ?? "unknown"}</Text>
        {proc?.pid && <Text dimColor>PID {proc.pid}</Text>}
      </Box>

      {/* Log box */}
      <TerminalBox
        lines={lines}
        height={logBoxHeight}
        width={cardWidth}
        isActive={isInputActive}
        focused={true}
        autoScrollToBottom
        onCopy={() => {
          void copyToClipboard(lines.join("\n")).then(() => setFeedback("Copied to clipboard")).catch(() => setFeedback("Copy failed"));
        }}
        footerHints={[
          { key: `stream:[${stream}]`, label: "" },
          { key: "\u2191\u2193", label: "scroll" },
          { key: "s", label: "toggle" },
          { key: "r", label: "rerun" },
          { key: "x", label: "stop" },
          { key: "c", label: "copy" },
          { key: "Esc", label: "back" },
        ]}
      />

      {/* Feedback */}
      {feedback && (
        <Box>
          <Text color={inkColors.accent}>{feedback}</Text>
        </Box>
      )}
    </Box>
  );
}
