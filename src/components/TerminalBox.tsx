import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { ScrollableBox } from "./ScrollableBox.js";
import { stripAnsi } from "../lib/ansi.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { inkColors, panel } from "../theme.js";
import ms from "ms";

interface TerminalBoxProps {
  lines?: string[];
  stdout?: string;
  stderr?: string;
  height: number;
  width?: number;
  isActive?: boolean;
  focused?: boolean;
  autoScrollToBottom?: boolean;
  emptyMessage?: string;
  title?: string;
  footerHints?: { key: string; label: string }[];
  copyEnabled?: boolean;
  onCopy?: () => void;
  borderColor?: string;
}

function cleanLines(raw: string): string[] {
  return stripAnsi(raw)
    .replace(/\r/g, "")
    .split("\n")
    .filter((line) => line.length > 0);
}

export function TerminalBox({
  lines,
  stdout,
  stderr,
  height,
  width,
  isActive = false,
  focused = true,
  autoScrollToBottom = true,
  emptyMessage = "No output yet...",
  title,
  footerHints,
  copyEnabled,
  onCopy,
  borderColor,
}: TerminalBoxProps): React.ReactElement {
  const [feedback, setFeedback] = useState<string>();
  const shouldCopy = copyEnabled ?? isActive;

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(undefined), ms("2s"));
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useInput(
    (input) => {
      if (input === "c") {
        if (onCopy) {
          onCopy();
          return;
        }
        const text = lines
          ? lines.join("\n")
          : [stdout, stderr].filter(Boolean).join("\n");
        void copyToClipboard(text).then(() => setFeedback("Copied to clipboard"));
      }
    },
    { isActive: shouldCopy },
  );

  let renderedLines: React.ReactNode[];

  if (lines) {
    renderedLines =
      lines.length === 0
        ? [<Text key="empty" dimColor>{emptyMessage}</Text>]
        : lines.map((line, i) => (
            <Text key={i} wrap="truncate">{line}</Text>
          ));
  } else {
    const outLines = stdout ? cleanLines(stdout) : [];
    const errLines = stderr ? cleanLines(stderr) : [];

    if (outLines.length === 0 && errLines.length === 0) {
      renderedLines = [<Text key="empty" dimColor>{emptyMessage}</Text>];
    } else {
      renderedLines = [
        ...outLines.map((line, i) => (
          <Text key={`o-${i}`} wrap="truncate">{line}</Text>
        )),
        ...errLines.map((line, i) => (
          <Text key={`e-${i}`} wrap="truncate" color="red">{line}</Text>
        )),
      ];
    }
  }

  const resolvedBorderColor = borderColor ?? (focused ? inkColors.accent : panel.borderDim);

  return (
    <Box flexDirection="column">
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={resolvedBorderColor}
        paddingX={1}
        width={width}
      >
        {title && (
          <Box marginBottom={0}>
            <Text bold dimColor>{title}</Text>
          </Box>
        )}
        <ScrollableBox
          height={height}
          isActive={isActive}
          autoScrollToBottom={autoScrollToBottom}
        >
          {renderedLines}
        </ScrollableBox>
      </Box>

      {feedback && (
        <Box>
          <Text color={inkColors.accent}>{feedback}</Text>
        </Box>
      )}

      {footerHints && footerHints.length > 0 && (
        <Box marginTop={1} gap={2}>
          {footerHints.map((hint) => (
            <Text key={hint.key} dimColor>{hint.key}:{hint.label}</Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
