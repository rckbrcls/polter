import React from "react";
import { Box, Text } from "ink";
import { inkColors } from "../theme.js";

interface Tab {
  id: string;
  icon: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeIndex: number;
  width?: number;
}

export function TabBar({ tabs, activeIndex, width = 80 }: TabBarProps): React.ReactElement {
  const narrow = width < 50;
  const medium = width < 80;

  return (
    <Box gap={1}>
      {tabs.map((tab, i) => {
        const isActive = i === activeIndex;
        const showLabel = narrow ? false : medium ? isActive : true;
        const displayText = showLabel ? `${tab.icon} ${tab.label}` : tab.icon;

        return (
          <Box key={tab.id} flexDirection="column">
            <Text
              color={isActive ? inkColors.accent : undefined}
              bold={isActive}
              dimColor={!isActive}
            >
              {displayText}
            </Text>
            {isActive && !narrow && (
              <Text color={inkColors.accent}>
                {"═".repeat(displayText.length)}
              </Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
