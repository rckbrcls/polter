import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { SelectList } from "../components/SelectList.js";
import { StatusBar } from "../components/StatusBar.js";
import { inkColors } from "../theme.js";
import { getToolInfo } from "../lib/toolResolver.js";
import type { CliToolId } from "../data/types.js";

interface ToolStatusProps {
  onBack: () => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

const toolIds: CliToolId[] = ["supabase", "gh", "vercel", "git"];

export function ToolStatus({ onBack, width = 80, height = 24, panelMode = false, isInputActive = true }: ToolStatusProps): React.ReactElement {
  const tools = useMemo(() => toolIds.map(getToolInfo), []);

  if (panelMode) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box marginBottom={1}>
          <Text bold color={inkColors.accent}>
            🔧 Tool Status
          </Text>
        </Box>

        {tools.map((tool) => (
          <Box key={tool.id} gap={1} marginLeft={2}>
            <Text color={tool.installed ? inkColors.accent : "red"}>
              {tool.installed ? "✓" : "✗"}
            </Text>
            <Box width={16}>
              <Text bold>{tool.label}</Text>
            </Box>
            <Text dimColor>
              {tool.installed
                ? tool.version ?? "installed"
                : "not found"}
            </Text>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={inkColors.accent}>
          🔧 Tool Status
        </Text>
      </Box>

      {tools.map((tool) => (
        <Box key={tool.id} gap={1} marginLeft={2}>
          <Text color={tool.installed ? inkColors.accent : "red"}>
            {tool.installed ? "✓" : "✗"}
          </Text>
          <Box width={16}>
            <Text bold>{tool.label}</Text>
          </Box>
          <Text dimColor>
            {tool.installed
              ? tool.version ?? "installed"
              : "not found"}
          </Text>
        </Box>
      ))}

      <Box marginTop={1}>
        <SelectList
          items={[{ value: "__back__", label: "← Back" }]}
          onSelect={onBack}
          onCancel={onBack}
          width={width}
          isInputActive={isInputActive}
        />
      </Box>

      <StatusBar hint="Enter to go back" width={width} />
    </Box>
  );
}
