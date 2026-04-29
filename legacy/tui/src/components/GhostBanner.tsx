import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { ghost as ghostData, inkColors, VERSION } from "../theme.js";
import { getToolLinkInfo, type ToolLinkInfo } from "../lib/toolResolver.js";
import { getMcpStatusInfo } from "../lib/mcpInstaller.js";
import { listProcesses } from "../lib/processManager.js";
import { toolColors } from "./ToolBadge.js";

interface GhostBannerProps {
  width?: number;
  compact?: boolean;
}

const McpBadge = React.memo(function McpBadge(): React.ReactElement {
  const [registered, setRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const info = getMcpStatusInfo();
      setRegistered(info.scopes.some((s) => s.registered));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  if (registered === null) {
    return (
      <Box borderStyle="round" borderColor="gray">
        <Text dimColor>mcp:…</Text>
      </Box>
    );
  }

  const color = registered ? "#3ECF8E" : "red";
  return (
    <Box borderStyle="round" borderColor={color}>
      <Text color={color} dimColor={!registered}>
        mcp:{registered ? "ok" : "x"}
      </Text>
    </Box>
  );
});

function ProcessBadge(): React.ReactElement {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(listProcesses().filter((p) => p.status === "running").length);
    const id = setInterval(() => {
      setCount(listProcesses().filter((p) => p.status === "running").length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const color = count > 0 ? "#3ECF8E" : inkColors.accent;
  return (
    <Box borderStyle="round" borderColor={color} borderDimColor={count === 0}>
      <Text color={color} dimColor={count === 0}>runs:{count}</Text>
    </Box>
  );
}

const TOOL_IDS = ["supabase", "gh", "vercel"] as const;

const ToolStatusBadges = React.memo(function ToolStatusBadges(): React.ReactElement {
  const [tools, setTools] = useState<ToolLinkInfo[] | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setTools(TOOL_IDS.map((id) => getToolLinkInfo(id)));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <Box gap={1}>
      {tools
        ? tools.map((t) => {
            const color = t.linked ? toolColors[t.id] : t.installed ? "yellow" : "red";
            return (
              <Box key={t.id} borderStyle="round" borderColor={color}>
                <Text color={color} dimColor={!t.installed}>
                  {t.id}:{t.linked ? "linked" : t.installed ? "ok" : "x"}
                </Text>
              </Box>
            );
          })
        : TOOL_IDS.map((id) => (
            <Box key={id} borderStyle="round" borderColor="gray">
              <Text dimColor>{id}:…</Text>
            </Box>
          ))
      }
      <McpBadge />
    </Box>
  );
});

export function GhostBanner({ width = 80, compact = false }: GhostBannerProps): React.ReactElement {
  if (compact) {
    if (width < 60) {
      return (
        <Box borderStyle="round" borderColor={inkColors.accent} flexDirection="column" alignItems="flex-start">
          <Box gap={1}>
            <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1} gap={2}>
              <Text color={inkColors.accent} bold>POLTER</Text>
              <Text dimColor>v{VERSION}</Text>
              <Text color="yellow">alpha</Text>
            </Box>
            <ProcessBadge />
          </Box>
          <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1}>
            <ToolStatusBadges />
          </Box>
        </Box>
      );
    }

    if (width >= 100) {
      // Wide terminal: ghost art + compact info
      return (
        <Box flexDirection="row" borderStyle="round" borderColor={inkColors.accent} gap={1} alignItems="flex-start">
          <Box flexDirection="column">
            {ghostData.art.map((line, i) => (
              <Text key={i} color={inkColors.accent}>{line}</Text>
            ))}
          </Box>
          <Box flexDirection="column" alignItems="flex-start">
            <Box gap={1}>
              <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1} gap={2}>
                <Text color={inkColors.accent} bold>POLTER</Text>
                <Text dimColor>v{VERSION}</Text>
                <Text color="yellow">alpha</Text>
              </Box>
              <ProcessBadge />
            </Box>
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
          <Box gap={1}>
            <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1} gap={2}>
              <Text color={inkColors.accent} bold>POLTER</Text>
              <Text dimColor>v{VERSION}</Text>
              <Text color="yellow">alpha</Text>
            </Box>
            <ProcessBadge />
          </Box>
          <ToolStatusBadges />
        </Box>
      </Box>
    );
  }

  if (width < 50) {
    return (
      <Box marginBottom={1} borderStyle="round" borderColor={inkColors.accent} flexDirection="column" alignItems="flex-start">
        <Box gap={1}>
          <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1} gap={2}>
            <Text color={inkColors.accent} bold>POLTER</Text>
            <Text dimColor>v{VERSION}</Text>
            <Text color="yellow">alpha</Text>
          </Box>
          <ProcessBadge />
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
        <Box gap={1}>
          <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1} gap={2}>
            <Text color={inkColors.accent} bold>POLTER</Text>
            <Text dimColor>v{VERSION}</Text>
            <Text color="yellow">alpha</Text>
          </Box>
          <ProcessBadge />
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
        <Box gap={1}>
          <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1} gap={2}>
            <Text color={inkColors.accent} bold>POLTER</Text>
            <Text dimColor>v{VERSION}</Text>
            <Text color="yellow">alpha</Text>
          </Box>
          <ProcessBadge />
        </Box>
        <Box borderStyle="round" borderColor={inkColors.accent} paddingX={1}>
          <ToolStatusBadges />
        </Box>
        <Text dimColor> Project & infrastructure orchestrator</Text>
      </Box>
    </Box>
  );
}
