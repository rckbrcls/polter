import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { Spinner } from "../components/Spinner.js";
import { SelectList, type SelectItem } from "../components/SelectList.js";
import { ConfirmPrompt } from "../components/ConfirmPrompt.js";
import { Divider } from "../components/Divider.js";
import { StatusBar } from "../components/StatusBar.js";
import { useCommand } from "../hooks/useCommand.js";
import { isPinnedRun, togglePinnedRun } from "../data/pins.js";
import { openInBrowser, copyToClipboard } from "../lib/clipboard.js";
import { inkColors } from "../theme.js";

interface CommandExecutionProps {
  args: string[];
  onBack: () => void;
  onExit: () => void;
}

type Phase =
  | "confirm"
  | "running"
  | "success-pin-offer"
  | "success"
  | "error-menu";

export function CommandExecution({
  args: initialArgs,
  onBack,
  onExit,
}: CommandExecutionProps): React.ReactElement {
  const [phase, setPhase] = useState<Phase>("confirm");
  const [currentArgs, setCurrentArgs] = useState(initialArgs);
  const [pinMessage, setPinMessage] = useState<string>();
  const { status, result, run, reset } = useCommand();

  const cmdDisplay = `supabase ${currentArgs.join(" ")}`;
  const runCommand = currentArgs.join(" ");

  // Start execution after confirm
  useEffect(() => {
    if (phase === "running" && status === "idle") {
      run(currentArgs);
    }
  }, [phase, status, run, currentArgs]);

  // Transition after command completes
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

  // Confirm phase
  if (phase === "confirm") {
    return (
      <Box flexDirection="column">
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
        />
      </Box>
    );
  }

  // Running phase
  if (phase === "running") {
    return (
      <Box flexDirection="column">
        <Divider />
        <Box marginY={1} gap={1}>
          <Text color={inkColors.accent} bold>
            ▶
          </Text>
          <Text dimColor>Running:</Text>
          <Text>{cmdDisplay}</Text>
        </Box>
        <Divider />
        <Box marginTop={1}>
          <Spinner label={`Executing ${cmdDisplay}...`} />
        </Box>
      </Box>
    );
  }

  if (phase === "success-pin-offer") {
    return (
      <Box flexDirection="column">
        <Divider />
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
        />
      </Box>
    );
  }

  // Success phase
  if (phase === "success") {
    return (
      <Box flexDirection="column">
        <Divider />
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

        <SelectList
          items={[{ value: "__back__", label: "← Back to menu" }]}
          onSelect={onBack}
          onCancel={onBack}
        />
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

  errorItems.push(
    {
      value: "docs",
      label: "📖 Open Supabase CLI docs",
      hint: "Opens in browser",
    },
    {
      value: "copy",
      label: "📋 Copy command to clipboard",
    },
    { value: "menu", label: "← Return to main menu" },
    { value: "exit", label: "🚪 Exit Polterbase" },
  );

  return (
    <Box flexDirection="column">
      <Divider />

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
                  💡 Supabase CLI not found in PATH
                </Text>
                <Box gap={1}>
                  <Text dimColor>Install it:</Text>
                  <Text color={inkColors.accent}>
                    https://supabase.com/docs/guides/cli
                  </Text>
                </Box>
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
            case "docs":
              await openInBrowser("https://supabase.com/docs/guides/cli");
              break;
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
      />

      <StatusBar />
    </Box>
  );
}
