import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { SelectList } from "../components/SelectList.js";
import { StatusBar } from "../components/StatusBar.js";
import { inkColors } from "../theme.js";
import { getToolLinkInfo, type ToolLinkInfo } from "../lib/toolResolver.js";
import { getMcpStatusInfo, type McpStatusInfo } from "../lib/mcpInstaller.js";
import type { Screen, CliToolId } from "../data/types.js";
import type { NavigationParams } from "../hooks/useNavigation.js";

interface ToolStatusProps {
  onBack: () => void;
  onNavigate?: (screen: Screen, params?: NavigationParams) => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

const toolIds: CliToolId[] = ["supabase", "gh", "vercel", "git", "pkg"];
const linkableTools = new Set<CliToolId>(["supabase", "gh", "vercel", "pkg"]);

export function ToolStatus({ onBack, onNavigate, width = 80, height = 24, panelMode = false, isInputActive = true }: ToolStatusProps): React.ReactElement {
  const [tools, setTools] = useState<ToolLinkInfo[] | null>(null);
  const [mcpInfo, setMcpInfo] = useState<McpStatusInfo | null>(null);

  useEffect(() => {
    // Defer heavy sync work (execSync calls) off the render path
    const t = setTimeout(() => {
      setTools(toolIds.map((id) => getToolLinkInfo(id)));
      setMcpInfo(getMcpStatusInfo());
    }, 0);
    return () => clearTimeout(t);
  }, []);

  if (!tools || !mcpInfo) {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Text color={inkColors.accent}>Loading tool status...</Text>
      </Box>
    );
  }

  const mcpRegistered = mcpInfo.scopes.some((s) => s.registered);
  const mcpScopeHint = mcpInfo.scopes
    .filter((s) => s.registered)
    .map((s) => s.scope)
    .join(", ");

  const handleSelect = (value: string) => {
    if (value === "mcp-manage" && onNavigate) {
      onNavigate("mcp-manage");
    } else if (value === "__back__") {
      onBack();
    }
  };

  if (panelMode) {
    const statusItems = [
      { value: "__section__", label: "Installed Tools", kind: "header" as const, selectable: false },
      ...tools.map((tool) => ({
        value: tool.id,
        label: `${tool.installed ? "\u2713" : "\u2717"} ${tool.label}`,
        hint: tool.installed
          ? `${tool.version ?? "installed"}${linkableTools.has(tool.id) ? (tool.linked ? ` \u2192 ${tool.project ? `linked (${tool.project})` : "linked"}` : " \u2192 not linked") : ""}`
          : "not found",
        kind: "action" as const,
      })),
      { value: "__mcp_section__", label: "MCP Server", kind: "header" as const, selectable: false },
      {
        value: "mcp-manage",
        label: `${mcpRegistered ? "\u2713" : "\u2717"} polter-mcp`,
        hint: `v${mcpInfo.installedVersion}${mcpRegistered ? ` \u2192 ${mcpScopeHint}` : " \u2192 not registered"}`,
        kind: "action" as const,
      },
    ];

    return (
      <Box flexDirection="column" paddingX={1}>
        <SelectList
          items={statusItems}
          onSelect={handleSelect}
          onCancel={onBack}
          boxedSections
          width={Math.max(20, width - 4)}
          maxVisible={Math.max(6, height - 6)}
          isInputActive={isInputActive}
          arrowNavigation
          panelFocused={isInputActive}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={inkColors.accent}>
          Tool Status
        </Text>
      </Box>

      {tools.map((tool) => (
        <Box key={tool.id} gap={1} marginLeft={2}>
          <Text color={tool.installed ? inkColors.accent : "red"}>
            {tool.installed ? "\u2713" : "\u2717"}
          </Text>
          <Box width={16}>
            <Text bold>{tool.label}</Text>
          </Box>
          <Text dimColor>
            {tool.installed
              ? `${tool.version ?? "installed"}${linkableTools.has(tool.id) ? (tool.linked ? ` \u2192 ${tool.project ?? "linked"}` : " \u2192 not linked") : ""}`
              : "not found"}
          </Text>
        </Box>
      ))}

      <Box marginTop={1} marginBottom={1}>
        <Text bold color={inkColors.accent}>  MCP Server</Text>
      </Box>
      <Box gap={1} marginLeft={2}>
        <Text color={mcpRegistered ? inkColors.accent : "red"}>
          {mcpRegistered ? "\u2713" : "\u2717"}
        </Text>
        <Box width={16}>
          <Text bold>polter-mcp</Text>
        </Box>
        <Text dimColor>
          v{mcpInfo.installedVersion}{mcpRegistered ? ` \u2192 ${mcpScopeHint}` : " \u2192 not registered"}
        </Text>
      </Box>

      <Box marginTop={1}>
        <SelectList
          items={[
            { value: "mcp-manage", label: "Manage MCP Server \u2192" },
            { value: "__back__", label: "\u2190 Back" },
          ]}
          onSelect={handleSelect}
          onCancel={onBack}
          width={width}
          isInputActive={isInputActive}
        />
      </Box>

      <StatusBar hint="Enter to select \u00B7 Esc back" width={width} />
    </Box>
  );
}
