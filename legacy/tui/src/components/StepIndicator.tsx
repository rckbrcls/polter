import React from "react";
import { Box, Text } from "ink";
import { Spinner } from "./Spinner.js";
import { inkColors } from "../theme.js";
import type { StepStatus } from "../pipeline/engine.js";

interface StepIndicatorProps {
  label: string;
  status: StepStatus;
  index: number;
}

const statusIcons: Record<StepStatus, string> = {
  pending: "○",
  running: "",
  success: "✓",
  error: "✗",
  skipped: "⊘",
};

const statusColors: Record<StepStatus, string | undefined> = {
  pending: undefined,
  running: inkColors.accent,
  success: inkColors.accent,
  error: "red",
  skipped: undefined,
};

export function StepIndicator({
  label,
  status,
  index,
}: StepIndicatorProps): React.ReactElement {
  return (
    <Box gap={1}>
      <Text dimColor>{String(index + 1).padStart(2, " ")}.</Text>
      {status === "running" ? (
        <Spinner label="" />
      ) : (
        <Text
          color={statusColors[status]}
          dimColor={status === "pending" || status === "skipped"}
        >
          {statusIcons[status]}
        </Text>
      )}
      <Text
        color={statusColors[status]}
        dimColor={status === "pending" || status === "skipped"}
        bold={status === "running"}
      >
        {label}
      </Text>
    </Box>
  );
}
