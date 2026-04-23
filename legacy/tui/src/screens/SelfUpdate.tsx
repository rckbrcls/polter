import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { ConfirmPrompt } from "../components/ConfirmPrompt.js";
import { Divider } from "../components/Divider.js";
import { SelectList } from "../components/SelectList.js";
import { StatusBar } from "../components/StatusBar.js";
import { TerminalBox } from "../components/TerminalBox.js";
import { useCommand } from "../hooks/useCommand.js";
import { inkColors } from "../theme.js";

interface SelfUpdateProps {
  onBack: () => void;
  onExit: () => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type Phase = "confirm" | "running" | "success" | "error";

const INSTALL_URL = "https://raw.githubusercontent.com/polterware/polter/main/install.sh";
const updateArgs = ["-fsSL", INSTALL_URL];
const updateDisplay = `curl -fsSL ${INSTALL_URL} | bash`;

export function SelfUpdate({
  onBack,
  onExit,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: SelfUpdateProps): React.ReactElement {
  const [phase, setPhase] = useState<Phase>("confirm");
  const { status, result, run, reset, partialStdout, partialStderr } = useCommand("curl", process.cwd(), {
    quiet: panelMode,
  });

  useEffect(() => {
    if (phase === "running" && status === "idle") {
      run([...updateArgs, "|", "bash"]);
    }
  }, [phase, run, status]);

  useEffect(() => {
    if (phase === "running" && status === "success") {
      setPhase("success");
    }

    if (phase === "running" && status === "error") {
      setPhase("error");
    }
  }, [phase, status]);

  if (phase === "confirm") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <ConfirmPrompt
          message="Download and install the latest Polter binary?"
          defaultValue={true}
          onConfirm={(confirmed) => {
            if (confirmed) {
              reset();
              setPhase("running");
              return;
            }
            onBack();
          }}
          onCancel={onBack}
          isInputActive={isInputActive}
          arrowNavigation={panelMode}
        />
        <Box marginTop={1} marginLeft={2} flexDirection="column">
          <Text dimColor>
            This re-runs the install script to update polter and polter-mcp in ~/.polter/bin/.
          </Text>
        </Box>
      </Box>
    );
  }

  if (phase === "running") {
    // Header (1) + divider (1) + command (1) + gap (1) + divider (1) + gap (1) + border (2) = 8
    const logBoxHeight = Math.max(3, height - 8);
    const cardWidth = Math.max(30, (panelMode ? width - 4 : width) - 2);

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Divider width={panelMode ? width - 4 : width} />
        <Box marginY={1} gap={1}>
          <Text color={inkColors.accent} bold>
            {"\u25B6"}
          </Text>
          <Text dimColor>Running:</Text>
          <Text>{updateDisplay}</Text>
        </Box>
        <Divider width={panelMode ? width - 4 : width} />
        <TerminalBox
          stdout={partialStdout}
          stderr={partialStderr}
          height={logBoxHeight}
          width={cardWidth}
          isActive={isInputActive}
          focused={true}
          autoScrollToBottom
          emptyMessage="Updating Polter..."
        />
      </Box>
    );
  }

  if (phase === "success") {
    const successItems = [
      { value: "__section__", label: "\u2705 Update Complete", kind: "header" as const, selectable: false },
      ...(!panelMode ? [{ value: "__back__", label: "\u2190 Back to menu", kind: "action" as const }] : []),
      { value: "__exit__", label: "\uD83D\uDEAA Exit Polter", kind: "action" as const },
    ];

    // Header area (~6) + select (~3) + border (2) = ~11
    const logBoxHeight = Math.max(3, height - 12);
    const cardWidth = Math.max(30, (panelMode ? width - 4 : width) - 2);

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Divider width={panelMode ? width - 4 : width} />
        <Box marginY={1} gap={1}>
          <Text color={inkColors.accent} bold>
            {"\u2713"}
          </Text>
          <Text color={inkColors.accent} bold>
            Update completed successfully!
          </Text>
        </Box>
        <Box marginBottom={1} marginLeft={2} flexDirection="column">
          <Text dimColor>Restart Polter to use the latest version.</Text>
        </Box>

        <TerminalBox
          stdout={result?.stdout}
          stderr={result?.stderr}
          height={logBoxHeight}
          width={cardWidth}
          isActive={isInputActive}
          focused={true}
        />

        <SelectList
          items={successItems}
          onSelect={(value) => {
            if (value === "__exit__") {
              onExit();
              return;
            }

            onBack();
          }}
          onCancel={onBack}
          boxedSections={panelMode}
          width={panelMode ? Math.max(20, width - 4) : width}
          maxVisible={panelMode ? Math.max(6, height - 6) : undefined}
          isInputActive={isInputActive}
          arrowNavigation={panelMode}
          panelFocused={isInputActive}
        />
      </Box>
    );
  }

  const errorItems = [
    { value: "__section__", label: "\uD83D\uDD27 Recovery Options", kind: "header" as const, selectable: false },
    { value: "retry", label: "\uD83D\uDD04 Retry update", kind: "action" as const },
    ...(!panelMode ? [{ value: "menu", label: "\u2190 Return to main menu", kind: "action" as const }] : []),
    { value: "exit", label: "\uD83D\uDEAA Exit Polter", kind: "action" as const },
  ];

  // Header area (~10) + select (~4) + manual fallback (~3) + border (2) = ~19
  const errorLogHeight = Math.max(3, height - 16);
  const errorCardWidth = Math.max(30, (panelMode ? width - 4 : width) - 2);

  return (
    <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
      <Divider width={panelMode ? width - 4 : width} />

      {result?.spawnError ? (
        <Box flexDirection="column" marginY={1}>
          <Box gap={1}>
            <Text color="red" bold>
              {"\u2717"}
            </Text>
            <Text color="red" bold>
              Failed to start update
            </Text>
          </Box>
          <Box marginLeft={2} marginTop={1}>
            <Text dimColor>Error: </Text>
            <Text color="red">{result.spawnError}</Text>
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column" marginY={1}>
          <Box gap={1}>
            <Text color="red" bold>
              {"\u2717"}
            </Text>
            <Text color="red">Update failed </Text>
            <Text dimColor>(exit code </Text>
            <Text color="red" bold>
              {String(result?.exitCode)}
            </Text>
            <Text dimColor>)</Text>
          </Box>
          <Box marginLeft={2} marginTop={1}>
            <Text dimColor>Command: </Text>
            <Text>{updateDisplay}</Text>
          </Box>
        </Box>
      )}

      <TerminalBox
        stdout={result?.stdout}
        stderr={result?.stderr}
        height={errorLogHeight}
        width={errorCardWidth}
        isActive={isInputActive}
        focused={true}
      />

      <Box marginBottom={1} marginLeft={2} flexDirection="column">
        <Text dimColor>Manual fallback:</Text>
        <Text color={inkColors.accent}>{updateDisplay}</Text>
      </Box>

      {!panelMode && (
        <Box marginTop={1} marginBottom={1}>
          <Text bold>What would you like to do?</Text>
        </Box>
      )}

      <SelectList
        items={errorItems}
        onSelect={(value) => {
          switch (value) {
            case "retry":
              reset();
              setPhase("running");
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
        panelFocused={isInputActive}
      />

      {!panelMode && <StatusBar width={width} />}
    </Box>
  );
}
