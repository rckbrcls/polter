import React from "react";
import { Box, Text } from "ink";
import { inkColors } from "../theme.js";

export interface KeyHint {
  key: string;
  action: string;
}

interface PanelFooterProps {
  hints: KeyHint[];
  width: number;
}

export function PanelFooter({ hints, width }: PanelFooterProps): React.ReactElement {
  return (
    <Box width={width}>
      <Box gap={1}>
        {hints.map((hint) => (
          <Box key={hint.key} gap={0}>
            <Text color={inkColors.accent} bold>
              {hint.key}
            </Text>
            <Text dimColor>:{hint.action}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
