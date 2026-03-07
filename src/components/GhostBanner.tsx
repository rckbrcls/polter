import React from "react";
import { Box, Text } from "ink";
import { ghost as ghostData, inkColors, VERSION } from "../theme.js";
import { getToolLinkInfo } from "../lib/toolResolver.js";
import { getMcpStatusInfo } from "../lib/mcpInstaller.js";
import { toolColors } from "./ToolBadge.js";

interface GhostBannerProps {
  width?: number;
  compact?: boolean;
}

const McpBadge = React.memo(function McpBadge(): React.ReactElement {
  const info = getMcpStatusInfo();
  const registered = info.scopes.some((s) => s.registered);
  const color = registered ? "#3ECF8E" : "red";
  return (
    <Box borderStyle="round" borderColor={color}>
      <Text color={color} dimColor={!registered}>
        mcp:{registered ? "ok" : "x"}
      </Text>
    </Box>
  );
});

const ToolStatusBadges = React.memo(function ToolStatusBadges(): React.ReactElement {
  const tools = (["supabase", "gh", "vercel"] as const).map((id) => getToolLinkInfo(id));
  return (
    <Box gap={1}>
      {tools.map((t) => {
        const color = t.linked ? toolColors[t.id] : t.installed ? "yellow" : "red";
        return (
          <Box key={t.id} borderStyle="round" borderColor={color}>
            <Text color={color} dimColor={!t.installed}>
              {t.id}:{t.linked ? "linked" : t.installed ? "ok" : "x"}
            </Text>
          </Box>
        );
      })}
      <McpBadge />
    </Box>
  );
});

export function GhostBanner({ width = 80, compact = false }: GhostBannerProps): React.ReactElement {
  if (compact) {
    if (width < 60) {
      return (
        <Box borderStyle="round" borderColor={inkColors.accent} flexDirection="column" alignItems="flex-start">
          <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1} gap={2}>
            <Text color={inkColors.accent} bold>POLTER</Text>
            <Text dimColor>v{VERSION}</Text>
            <Text color="yellow">alpha</Text>
          </Box>
          <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1}>
            <ToolStatusBadges />
          </Box>
        </Box>
      );
    }

    // Compact: original ghost art + info on the right
    return (
      <Box flexDirection="row" borderStyle="round" borderColor={inkColors.accent} gap={1} alignItems="flex-start">
        <Box flexDirection="column">
          {ghostData.art.map((line, i) => (
            <Text key={i} color={inkColors.accent}>{line}</Text>
          ))}
        </Box>
        <Box flexDirection="column" alignItems="flex-start">
          <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1} gap={2}>
            <Text color={inkColors.accent} bold>POLTER</Text>
            <Text dimColor>v{VERSION}</Text>
            <Text color="yellow">alpha</Text>
          </Box>
          <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1}>
            <ToolStatusBadges />
          </Box>
        </Box>
      </Box>
    );
  }

  if (width < 50) {
    return (
      <Box marginBottom={1} borderStyle="round" borderColor={inkColors.accent} flexDirection="column" alignItems="flex-start">
        <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1} gap={2}>
          <Text color={inkColors.accent} bold>POLTER</Text>
          <Text dimColor>v{VERSION}</Text>
          <Text color="yellow">alpha</Text>
        </Box>
        <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1}>
          <ToolStatusBadges />
        </Box>
      </Box>
    );
  }

  if (width < 80) {
    return (
      <Box
        flexDirection="column"
        alignItems="flex-start"
        borderStyle="round"
        borderColor={inkColors.accent}
        marginBottom={1}
      >
        <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1} gap={2}>
          <Text color={inkColors.accent} bold>POLTER</Text>
          <Text dimColor>v{VERSION}</Text>
          <Text color="yellow">alpha</Text>
        </Box>
        <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1}>
          <ToolStatusBadges />
        </Box>
        <Text dimColor>Project & infrastructure orchestrator</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="row" alignItems="flex-start" borderStyle="round" borderColor={inkColors.accent} gap={1} marginBottom={1}>
      <Box flexDirection="column">
        {ghostData.art.map((line, i) => (
          <Text key={i} color={inkColors.accent}>
            {line}
          </Text>
        ))}
      </Box>

      <Box flexDirection="column" alignItems="flex-start">
        <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1} gap={2}>
          <Text color={inkColors.accent} bold>POLTER</Text>
          <Text dimColor>v{VERSION}</Text>
          <Text color="yellow">alpha</Text>
        </Box>
        <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1}>
          <ToolStatusBadges />
        </Box>
        <Text dimColor> Project & infrastructure orchestrator</Text>
      </Box>
    </Box>
  );
}
