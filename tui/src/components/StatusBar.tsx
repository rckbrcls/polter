import React from "react";
import { Box, Text } from "ink";
import { VERSION } from "../theme.js";

interface StatusBarProps {
  hint?: string;
  width?: number;
}

export function StatusBar({ hint, width = 80 }: StatusBarProps): React.ReactElement {
  return (
    <Box marginTop={1} justifyContent="space-between">
      <Text dimColor>
        {hint || "↑↓ navigate · Enter select · Esc back"}
      </Text>
      {width >= 60 && (
        <Text dimColor>
          polter v{VERSION}
        </Text>
      )}
    </Box>
  );
}
