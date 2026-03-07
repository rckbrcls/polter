import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { spawn } from "node:child_process";
import { inkColors } from "../theme.js";
import { getProcessOutput, listProcesses, stopProcess, type ProcessInfo } from "../lib/processManager.js";

interface ProcessLogsProps {
  processId: string;
  onBack: () => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type StreamFilter = "both" | "stdout" | "stderr";

function copyToClipboard(text: string): void {
  const cmd = process.platform === "darwin" ? "pbcopy" : "xclip";
  const args = process.platform === "darwin" ? [] : ["-selection", "clipboard"];
  const proc = spawn(cmd, args, { stdio: ["pipe", "ignore", "ignore"] });
  proc.stdin?.write(text);
  proc.stdin?.end();
}

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
        const output = getProcessOutput(processId, logBoxHeight, stream);
        const combined = stream === "stderr"
          ? output.stderr
          : stream === "stdout"
            ? output.stdout
            : [...output.stdout, ...output.stderr].slice(-logBoxHeight);
        setLines(combined);
      } catch {
        setLines([`Process "${processId}" not found`]);
      }

      const all = listProcesses();
      setProc(all.find((p) => p.id === processId));
    };

    refresh();
    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, [processId, logBoxHeight, stream]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(undefined), 2000);
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

  const handleCopy = useCallback(() => {
    try {
      copyToClipboard(lines.join("\n"));
      setFeedback("Copied to clipboard");
    } catch {
      setFeedback("Copy failed");
    }
  }, [lines]);

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
      if (proc?.status === "running") handleStop();
      return;
    }

    if (input === "c") {
      handleCopy();
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
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={inkColors.accent}
        paddingX={1}
        height={logBoxHeight + 2}
        width={cardWidth}
        overflowY="hidden"
      >
        {lines.length === 0 ? (
          <Text dimColor>No output yet...</Text>
        ) : (
          lines.map((line, i) => (
            <Text key={i} wrap="truncate">{line}</Text>
          ))
        )}
      </Box>

      {/* Feedback */}
      {feedback && (
        <Box>
          <Text color={inkColors.accent}>{feedback}</Text>
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1} gap={2}>
        <Text dimColor>stream:[<Text bold color={inkColors.accent}>{stream}</Text>]</Text>
        <Text dimColor>s:toggle</Text>
        <Text dimColor>x:stop</Text>
        <Text dimColor>c:copy</Text>
        <Text dimColor>Esc:back</Text>
      </Box>
    </Box>
  );
}
