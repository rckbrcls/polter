import React, { useState, useMemo, useCallback } from "react";
import { Box, Text } from "ink";
import { SelectList } from "../components/SelectList.js";
import { StatusBar } from "../components/StatusBar.js";
import { inkColors } from "../theme.js";
import {
  getMcpStatusInfo,
  installMcpServerSilent,
  removeMcpServerSilent,
  type McpStatusInfo,
  type McpActionResult,
} from "../lib/mcpInstaller.js";
import type { McpScope } from "../lib/cliArgs.js";

interface McpManageProps {
  onBack: () => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type Phase = "overview" | "executing" | "result";
type Action = { type: "install" | "remove"; scope: McpScope };

export function McpManage({
  onBack,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: McpManageProps): React.ReactElement {
  const [status, setStatus] = useState<McpStatusInfo>(() => getMcpStatusInfo());
  const [phase, setPhase] = useState<Phase>("overview");
  const [action, setAction] = useState<Action | null>(null);
  const [result, setResult] = useState<McpActionResult | null>(null);

  const refreshStatus = useCallback(() => {
    setStatus(getMcpStatusInfo());
  }, []);

  const executeAction = useCallback(async (act: Action) => {
    setAction(act);
    setPhase("executing");
    try {
      const res = act.type === "install"
        ? await installMcpServerSilent(act.scope)
        : await removeMcpServerSilent(act.scope);
      setResult(res);
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : "Unknown error" });
    }
    setPhase("result");
  }, []);

  if (phase === "executing") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Box marginBottom={1}>
          <Text color={inkColors.accent}>
            {action?.type === "install" ? "Installing" : "Removing"} MCP server ({action?.scope})...
          </Text>
        </Box>
      </Box>
    );
  }

  if (phase === "result" && result) {
    const resultItems = [
      { value: "back-overview", label: "← Back to overview" },
      ...(!panelMode ? [{ value: "__back__", label: "← Back to Tool Status" }] : []),
    ];

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Box marginBottom={1}>
          <Text color={result.success ? inkColors.accent : "red"}>
            {result.success ? "✓" : "✗"} {result.message}
          </Text>
        </Box>
        <SelectList
          items={resultItems}
          onSelect={(val) => {
            if (val === "back-overview") {
              refreshStatus();
              setPhase("overview");
            } else {
              onBack();
            }
          }}
          onCancel={() => {
            refreshStatus();
            setPhase("overview");
          }}
          width={panelMode ? Math.max(20, width - 4) : width}
          isInputActive={isInputActive}
          arrowNavigation={panelMode}
          panelFocused={panelMode ? isInputActive : undefined}
        />
        {!panelMode && <StatusBar hint="Enter select . Esc back" width={width} />}
      </Box>
    );
  }

  // Overview phase
  const projectScope = status.scopes.find((s) => s.scope === "project");
  const userScope = status.scopes.find((s) => s.scope === "user");

  const items = panelMode
    ? [
        { value: "__info__", label: `Version: v${status.installedVersion}`, kind: "header" as const, selectable: false },
        { value: "__proj__", label: `Project: ${projectScope?.registered ? "registered" : "not registered"}`, kind: "header" as const, selectable: false },
        { value: "__user__", label: `User: ${userScope?.registered ? "registered" : "not registered"}`, kind: "header" as const, selectable: false },
        { value: "__actions__", label: "Actions", kind: "header" as const, selectable: false },
        { value: "install-project", label: "Install (project scope)", kind: "action" as const },
        { value: "install-user", label: "Install (user scope)", kind: "action" as const },
        { value: "remove-project", label: "Remove (project scope)", kind: "action" as const },
        { value: "remove-user", label: "Remove (user scope)", kind: "action" as const },
      ]
    : [
        { value: "install-project", label: "Install (project scope)" },
        { value: "install-user", label: "Install (user scope)" },
        { value: "remove-project", label: "Remove (project scope)" },
        { value: "remove-user", label: "Remove (user scope)" },
        { value: "__back__", label: "← Back" },
      ];

  const handleSelect = (value: string) => {
    switch (value) {
      case "install-project":
        executeAction({ type: "install", scope: "project" });
        break;
      case "install-user":
        executeAction({ type: "install", scope: "user" });
        break;
      case "remove-project":
        executeAction({ type: "remove", scope: "project" });
        break;
      case "remove-user":
        executeAction({ type: "remove", scope: "user" });
        break;
      default:
        onBack();
    }
  };

  if (panelMode) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <SelectList
          items={items}
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
          MCP Server Management
        </Text>
      </Box>

      <Box marginLeft={2} marginBottom={1} flexDirection="column">
        <Text>Version: v{status.installedVersion}</Text>
        <Text>
          Project: <Text color={projectScope?.registered ? inkColors.accent : undefined} dimColor={!projectScope?.registered}>
            {projectScope?.registered ? "registered" : "not registered"}
          </Text>
        </Text>
        <Text>
          User: <Text color={userScope?.registered ? inkColors.accent : undefined} dimColor={!userScope?.registered}>
            {userScope?.registered ? "registered" : "not registered"}
          </Text>
        </Text>
      </Box>

      <SelectList
        items={items}
        onSelect={handleSelect}
        onCancel={onBack}
        width={width}
        isInputActive={isInputActive}
      />

      <StatusBar hint="Enter select . Esc back" width={width} />
    </Box>
  );
}
