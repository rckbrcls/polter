import React from "react";
import { Box, Text } from "ink";
import { inkColors } from "../theme.js";

interface PipelineProgressBarProps {
  total: number;
  completed: number;
  errors: number;
  width?: number;
}

export function PipelineProgressBar({
  total,
  completed,
  errors,
  width = 80,
}: PipelineProgressBarProps): React.ReactElement {
  const barWidth = Math.max(10, width - 20);
  const filledCount = total > 0 ? Math.round((completed / total) * barWidth) : 0;
  const filled = "█".repeat(filledCount);
  const empty = "░".repeat(barWidth - filledCount);

  return (
    <Box gap={1}>
      <Text color={errors > 0 ? "red" : inkColors.accent}>
        [{filled}{empty}]
      </Text>
      <Text dimColor>
        {completed}/{total}
        {errors > 0 ? ` (${errors} failed)` : ""}
      </Text>
    </Box>
  );
}
