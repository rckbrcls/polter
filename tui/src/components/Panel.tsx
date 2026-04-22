import React from "react";
import { Box, Text } from "ink";
import { inkColors, panel } from "../theme.js";

interface PanelProps {
  id: string;
  title?: string;
  width: number;
  height: number;
  focused?: boolean;
  children: React.ReactNode;
}

export function Panel({
  id,
  title,
  width,
  height,
  focused = false,
  children,
}: PanelProps): React.ReactElement {
  const borderColor = focused ? panel.borderFocused : panel.borderDim;

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle="round"
      borderColor={borderColor}
      overflow="hidden"
    >
      {title && (
        <Box marginBottom={0}>
          <Text color={focused ? inkColors.accent : undefined} bold={focused} dimColor={!focused}>
            {" "}{title}{" "}
          </Text>
        </Box>
      )}
      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {children}
      </Box>
    </Box>
  );
}
