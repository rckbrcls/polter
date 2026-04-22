import React from "react";
import { Box, Text } from "ink";
import { inkColors } from "../theme.js";

interface ModalProps {
  title: string;
  width: number;
  height: number;
  children: React.ReactNode;
}

export function Modal({
  title,
  width,
  height,
  children,
}: ModalProps): React.ReactElement {
  const modalWidth = Math.min(width - 4, 60);
  const modalHeight = Math.min(height - 4, 20);
  const padX = Math.max(0, Math.floor((width - modalWidth) / 2));
  const padY = Math.max(0, Math.floor((height - modalHeight) / 2));

  return (
    <Box flexDirection="column" width={width} height={height}>
      {padY > 0 && <Box height={padY} />}
      <Box marginLeft={padX}>
        <Box
          flexDirection="column"
          width={modalWidth}
          height={modalHeight}
          borderStyle="double"
          borderColor={inkColors.accent}
          paddingX={1}
        >
          <Box marginBottom={1}>
            <Text color={inkColors.accent} bold>
              {title}
            </Text>
          </Box>
          <Box flexDirection="column" flexGrow={1} overflow="hidden">
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
