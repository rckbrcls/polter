import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { Spinner } from "../components/Spinner.js";
import { SelectList, type SelectItem } from "../components/SelectList.js";
import { ConfirmPrompt } from "../components/ConfirmPrompt.js";
import { ToolBadge } from "../components/ToolBadge.js";
import { Divider } from "../components/Divider.js";
import { StatusBar } from "../components/StatusBar.js";
import { useCommand } from "../hooks/useCommand.js";
import { isPinnedRun, togglePinnedRun } from "../data/pins.js";
import { openInBrowser, copyToClipboard } from "../lib/clipboard.js";
import { inkColors } from "../theme.js";
import type { CliToolId } from "../data/types.js";

interface CommandExecutionProps {
  args: string[];
  tool?: CliToolId;
  onBack: () => void;
  onExit: () => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type Phase =
  | "confirm"
  | "running"
  | "success-pin-offer"
  | "success"
  | "error-menu";

export function CommandExecution({
  args: initialArgs,
  tool = "supabase",
  onBack,
  onExit,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: CommandExecutionProps): React.ReactElement {
  const [phase, setPhase] = useState<Phase>("confirm");
  const [currentArgs, setCurrentArgs] = useState(initialArgs);
  const [pinMessage, setPinMessage] = useState<string>();
  const { status, result, run, reset } = useCommand(tool);

  const cmdDisplay = `${tool} ${currentArgs.join(" ")}`;
  const runCommand = currentArgs.join(" ");

  useEffect(() => {
    if (phase === "running" && status === "idle") {
      run(currentArgs);
    }
  }, [phase, status, run, currentArgs]);

  useEffect(() => {
    if (phase === "running" && status === "success") {
      if (isPinnedRun(runCommand)) {
        setPhase("success");
      } else {
        setPhase("success-pin-offer");
      }
    }
    if (phase === "running" && status === "error") {
      setPhase("error-menu");
    }
  }, [phase, runCommand, status]);

  if (phase === "confirm") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <ConfirmPrompt
          message={`Execute ${cmdDisplay}?`}
          defaultValue={true}
          onConfirm={(confirmed) => {
            if (confirmed) {
              setPhase("running");
            } else {
              onBack();
            }
          }}
          onCancel={onBack}
          isInputActive={isInputActive}
          arrowNavigation={panelMode}
        />
      </Box>
    );
  }

  if (phase === "running") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Divider width={panelMode ? width - 4 : width} />
        <Box marginY={1} gap={1}>
          <Text color={inkColors.accent} bold>
            ▶
          </Text>
          <Text dimColor>Running:</Text>
          <Text>{cmdDisplay}</Text>
          <ToolBadge tool={tool} />
        </Box>
        <Divider width={panelMode ? width - 4 : width} />
        <Box marginTop={1}>
          <Spinner label={`Executing ${cmdDisplay}...`} />
        </Box>
      </Box>
    );
  }

  if (phase === "success-pin-offer") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Divider width={panelMode ? width - 4 : width} />
        <Box marginY={1} gap={1}>
          <Text color={inkColors.accent} bold>
            ✓
          </Text>
          <Text color={inkColors.accent} bold>
            Command completed successfully!
          </Text>
        </Box>

        <ConfirmPrompt
          message="Pin this exact command?"
          defaultValue={false}
          onConfirm={(shouldPin) => {
            if (shouldPin && !isPinnedRun(runCommand)) {
              togglePinnedRun(runCommand);
              setPinMessage("Exact command pinned to Pinned Runs.");
            }
            setPhase("success");
          }}
          onCancel={() => setPhase("success")}
          isInputActive={isInputActive}
          arrowNavigation={panelMode}
        />
      </Box>
    );
  }

  if (phase === "success") {
    const successItems = panelMode
      ? []
      : [{ value: "__back__", label: "← Back to menu" }];

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Divider width={panelMode ? width - 4 : width} />
        <Box marginY={1} gap={1}>
          <Text color={inkColors.accent} bold>
            ✓
          </Text>
          <Text color={inkColors.accent} bold>
            Command completed successfully!
          </Text>
        </Box>

        {pinMessage && (
          <Box marginBottom={1}>
            <Text color={inkColors.accent}>{pinMessage}</Text>
          </Box>
        )}

        {successItems.length > 0 && (
          <SelectList
            items={successItems}
            onSelect={onBack}
            onCancel={onBack}
            width={panelMode ? Math.max(20, width - 4) : width}
            maxVisible={panelMode ? Math.max(6, height - 6) : undefined}
            isInputActive={isInputActive}
            arrowNavigation={panelMode}
            boxedSections={panelMode}
          />
        )}
      </Box>
    );
  }

  // Error menu
  const hasDebug = currentArgs.includes("--debug");

  const errorItems: SelectItem[] = [];

  if (!result?.spawnError) {
    errorItems.push({ value: "retry", label: "🔄 Retry the same command" });
    if (!hasDebug) {
      errorItems.push({
        value: "retry-debug",
        label: "🐛 Retry with --debug",
        hint: "Append --debug for verbose logs",
      });
    }
  }

  errorItems.push({
    value: "copy",
    label: "📋 Copy command to clipboard",
  });
  if (!panelMode) {
    errorItems.push({ value: "menu", label: "← Return to main menu" });
  }
  errorItems.push({ value: "exit", label: "🚪 Exit Polter" });

  return (
    <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
      <Divider width={panelMode ? width - 4 : width} />

      {result?.spawnError ? (
        <Box flexDirection="column" marginY={1}>
          <Box gap={1}>
            <Text color="red" bold>
              ✗
            </Text>
            <Text color="red" bold>
              Failed to start command
            </Text>
          </Box>
          <Box marginLeft={2} marginTop={1}>
            <Text dimColor>Error: </Text>
            <Text color="red">{result.spawnError}</Text>
          </Box>
          {(result.spawnError.includes("ENOENT") ||
            result.spawnError.includes("not found")) && (
              <Box flexDirection="column" marginLeft={2} marginTop={1}>
                <Text color={inkColors.accent} bold>
                  💡 {tool} CLI not found in this repository or PATH
                </Text>
              </Box>
            )}
        </Box>
      ) : (
        <Box flexDirection="column" marginY={1}>
          <Box gap={1}>
            <Text color="red" bold>
              ✗
            </Text>
            <Text color="red">Command failed </Text>
            <Text dimColor>(exit code </Text>
            <Text color="red" bold>
              {String(result?.exitCode)}
            </Text>
            <Text dimColor>)</Text>
          </Box>
          <Box marginLeft={2} marginTop={1}>
            <Text dimColor>Command: </Text>
            <Text>{cmdDisplay}</Text>
          </Box>
          {!hasDebug && (
            <Box marginLeft={2} marginTop={1} gap={1}>
              <Text dimColor>💡 Tip: retry with</Text>
              <Text color={inkColors.accent}>--debug</Text>
              <Text dimColor>to see detailed logs</Text>
            </Box>
          )}
        </Box>
      )}

      <Box marginTop={1} marginBottom={1}>
        <Text bold>What would you like to do?</Text>
      </Box>

      <SelectList
        items={errorItems}
        onSelect={async (action) => {
          switch (action) {
            case "retry":
              setPinMessage(undefined);
              reset();
              setPhase("running");
              break;
            case "retry-debug": {
              const newArgs = [...currentArgs, "--debug"];
              setCurrentArgs(newArgs);
              setPinMessage(undefined);
              reset();
              setPhase("running");
              break;
            }
            case "copy":
              await copyToClipboard(cmdDisplay);
              break;
            case "menu":
              onBack();
              break;
            case "exit":
              onExit();
              break;
          }
        }}
        onCancel={onBack}
        boxedSections={panelMode}
        width={panelMode ? Math.max(20, width - 4) : width}
        maxVisible={panelMode ? Math.max(6, height - 6) : undefined}
        isInputActive={isInputActive}
        arrowNavigation={panelMode}
      />

      {!panelMode && <StatusBar width={width} />}
    </Box>
  );
}
