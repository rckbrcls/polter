import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { Spinner } from "../components/Spinner.js";
import { SelectList, type SelectItem } from "../components/SelectList.js";
import { ConfirmPrompt } from "../components/ConfirmPrompt.js";
import { ToolBadge } from "../components/ToolBadge.js";
import { Divider } from "../components/Divider.js";
import { StatusBar } from "../components/StatusBar.js";
import { CommandOutput } from "../components/CommandOutput.js";
import { useCommand } from "../hooks/useCommand.js";
import { useInteractiveRun } from "../hooks/useInteractiveRun.js";
import { isPinnedRun, togglePinnedRun } from "../data/pins.js";
import { openInBrowser, copyToClipboard } from "../lib/clipboard.js";
import { parseErrorSuggestions } from "../lib/errorSuggestions.js";
import { inkColors, panel } from "../theme.js";
import { getToolDisplayName, resolveToolCommand } from "../lib/toolResolver.js";
import { startProcess, generateProcessId } from "../lib/processManager.js";
import type { CliToolId } from "../data/types.js";

interface CommandExecutionProps {
  args: string[];
  tool?: CliToolId;
  rawCommand?: string;
  interactive?: boolean;
  onBack: () => void;
  onHome?: () => void;
  onExit: () => void;
  onRunSuggestion?: (tool: CliToolId, args: string[]) => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type Phase =
  | "confirm"
  | "running"
  | "background-started"
  | "success-pin-offer"
  | "success"
  | "error-menu";

export function CommandExecution({
  args: initialArgs,
  tool = "supabase",
  rawCommand,
  interactive = false,
  onBack,
  onHome,
  onExit,
  onRunSuggestion,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: CommandExecutionProps): React.ReactElement {
  const [phase, setPhase] = useState<Phase>("confirm");
  const [currentArgs, setCurrentArgs] = useState(initialArgs);
  const [pinMessage, setPinMessage] = useState<string>();
  const execution = rawCommand ?? tool;
  const { status, result, run, reset, abort, partialStdout, partialStderr } = useCommand(execution, process.cwd(), {
    quiet: panelMode,
  });
  const { runInteractive } = useInteractiveRun();

  const [outputFocused, setOutputFocused] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string>();

  const cmdDisplay = rawCommand
    ? `${rawCommand} ${currentArgs.join(" ")}`.trim()
    : `${getToolDisplayName(tool)} ${currentArgs.join(" ")}`;
  const runCommand = currentArgs.join(" ");

  useInput(
    (_input, key) => {
      if (key.escape) {
        abort();
        onBack();
      }
    },
    { isActive: isInputActive && phase === "running" },
  );

  useInput(
    (input, key) => {
      if (input === "o" && !outputFocused) {
        setOutputFocused(true);
      }
      if (key.escape && outputFocused) {
        setOutputFocused(false);
      }
    },
    { isActive: isInputActive && phase === "error-menu" },
  );

  useEffect(() => {
    if (phase === "background-started") {
      const t = setTimeout(() => onBack(), 1500);
      return () => clearTimeout(t);
    }
  }, [phase, onBack]);

  useEffect(() => {
    if (phase === "running" && status === "idle") {
      if (panelMode && interactive) {
        const interactiveResult = runInteractive(tool, currentArgs);
        if (!interactiveResult.spawnError && interactiveResult.exitCode === 0) {
          setPhase("success");
        } else {
          setPhase("error-menu");
        }
      } else {
        run(currentArgs);
      }
    }
  }, [phase, status, run, currentArgs, panelMode, interactive, tool, runInteractive]);

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
    const pinned = isPinnedRun(runCommand);
    const confirmItems: SelectItem[] = [
      { value: "execute", label: "▶ Execute command" },
      {
        value: "pin",
        label: pinned ? "📌 Unpin command" : "📌 Pin command",
        hint: "Save to quick access",
      },
      {
        value: "background",
        label: "⏩ Run in background",
        hint: "Start as background process",
      },
      { value: "cancel", label: "← Cancel" },
    ];

    const confirmContent = (
      <Box flexDirection="column">
        <Box marginBottom={1} gap={1}>
          <Text color={inkColors.accent} bold>
            {"▶"} {cmdDisplay}
          </Text>
          <ToolBadge tool={tool} />
        </Box>

        {pinMessage && (
          <Box marginBottom={1}>
            <Text color={inkColors.accent}>{pinMessage}</Text>
          </Box>
        )}

        <SelectList
          items={confirmItems}
          onSelect={(action) => {
            switch (action) {
              case "execute":
                setPinMessage(undefined);
                setPhase("running");
                break;
              case "pin":
                togglePinnedRun(runCommand);
                setPinMessage(
                  isPinnedRun(runCommand)
                    ? "✓ Command pinned"
                    : "✓ Command unpinned",
                );
                break;
              case "background": {
                const cwd = process.cwd();
                if (rawCommand) {
                  const id = generateProcessId(rawCommand, currentArgs);
                  startProcess(id, rawCommand, currentArgs, cwd);
                } else {
                  const resolved = resolveToolCommand(tool, cwd);
                  const id = generateProcessId(resolved.command, currentArgs);
                  startProcess(id, resolved.command, currentArgs, cwd, resolved.env);
                }
                setPhase("background-started");
                break;
              }
              case "cancel":
                onBack();
                break;
            }
          }}
          onCancel={onBack}
          width={panelMode ? Math.max(20, width - 4) : width}
          isInputActive={isInputActive}
          arrowNavigation={panelMode}
          boxedSections={panelMode}
          panelFocused={isInputActive}
        />
      </Box>
    );

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        {panelMode ? (
          <Box
            flexDirection="column"
            borderStyle="round"
            borderColor={isInputActive ? inkColors.accent : panel.borderDim}
            borderDimColor
            paddingX={1}
          >
            {confirmContent}
          </Box>
        ) : (
          confirmContent
        )}
      </Box>
    );
  }

  if (phase === "background-started") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Box marginY={1} gap={1}>
          <Text color="#3ECF8E" bold>✓</Text>
          <Text color="#3ECF8E" bold>Started in background</Text>
        </Box>
        <Box>
          <Text dimColor>Command: </Text>
          <Text>{cmdDisplay}</Text>
        </Box>
      </Box>
    );
  }

  if (phase === "running") {
    const hasPartialOutput = partialStdout.length > 0 || partialStderr.length > 0;
    // Reserve lines for: divider(1) + header(1) + margins(2) + divider(1) + spinner(1) + esc hint(1) + padding
    const streamOutputHeight = Math.max(3, height - 10);

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Divider width={panelMode ? width - 4 : width} />
        <Box marginY={1} gap={1}>
          <Text color={inkColors.accent} bold>
            {"▶"}
          </Text>
          <Text dimColor>Running:</Text>
          <Text>{cmdDisplay}</Text>
          <ToolBadge tool={tool} />
        </Box>
        <Divider width={panelMode ? width - 4 : width} />
        <Box marginTop={1}>
          <Spinner label={`Executing ${cmdDisplay}...`} />
        </Box>
        {hasPartialOutput && (
          <CommandOutput
            stdout={partialStdout}
            stderr={partialStderr}
            height={streamOutputHeight}
            isActive={false}
          />
        )}
        <Box marginTop={1}>
          <Text dimColor>Press </Text>
          <Text color={inkColors.accent}>Esc</Text>
          <Text dimColor> to abort</Text>
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
            {"✓"}
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
    const successItems: SelectItem[] = [
      { value: "__back__", label: "\u2190 Back to menu" },
    ];

    // Reserve lines for: divider(1) + success msg(1) + margins(2) + pin msg(1?) + back item box(~5)
    const outputHeight = Math.max(3, height - 12);

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Divider width={panelMode ? width - 4 : width} />
        <Box marginY={1} gap={1}>
          <Text color={inkColors.accent} bold>
            {"✓"}
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

        <CommandOutput
          stdout={result?.stdout}
          stderr={result?.stderr}
          height={outputHeight}
          isActive={isInputActive}
        />

        <SelectList
          items={successItems}
          onSelect={onHome ?? onBack}
          onCancel={onHome ?? onBack}
          width={panelMode ? Math.max(20, width - 4) : width}
          maxVisible={panelMode ? Math.max(6, height - 6) : undefined}
          isInputActive={isInputActive}
          arrowNavigation={panelMode}
          boxedSections={panelMode}
          panelFocused={isInputActive}
        />
      </Box>
    );
  }

  // Error menu
  const hasDebug = currentArgs.includes("--debug");

  const suggestions = result
    ? parseErrorSuggestions(result.stdout, result.stderr, tool)
    : [];

  const errorItems: SelectItem[] = [];

  if (suggestions.length > 0) {
    errorItems.push({
      value: "__suggestions_header__",
      label: "\uD83D\uDCA1 Suggested fixes",
      kind: "header",
    });
    for (const s of suggestions) {
      errorItems.push({
        value: `suggest:${s.display}`,
        label: s.display,
        hint: "from error output",
      });
    }
  }

  if (suggestions.length > 0) {
    errorItems.push({
      value: "__actions_header__",
      label: "",
      kind: "header",
    });
  }

  if (!result?.spawnError) {
    errorItems.push({ value: "retry", label: "\uD83D\uDD04 Retry the same command" });
    if (!hasDebug) {
      errorItems.push({
        value: "retry-debug",
        label: "\uD83D\uDC1B Retry with --debug",
        hint: "Append --debug for verbose logs",
      });
    }
  }

  if (panelMode && !result?.spawnError) {
    errorItems.push({
      value: "run-interactive",
      label: "\uD83D\uDCBB Run in terminal",
      hint: "Suspend TUI and run interactively",
    });
  }

  errorItems.push({
    value: "copy",
    label: "\uD83D\uDCCB Copy command to clipboard",
  });
  errorItems.push({
    value: "copy-output",
    label: "📄 Copy output to clipboard",
  });
  errorItems.push({
    value: "__nav_header__",
    label: "",
    kind: "header",
  });
  errorItems.push({
    value: "menu",
    label: "\u2190 Back to menu",
  });

  return (
    <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
      <Divider width={panelMode ? width - 4 : width} />

      {result?.spawnError ? (
        <Box flexDirection="column" marginY={1}>
          <Box gap={1}>
            <Text color="red" bold>
              {"✗"}
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
                  {"\uD83D\uDCA1"} {tool} CLI not found in this repository or PATH
                </Text>
              </Box>
            )}
        </Box>
      ) : (
        <Box flexDirection="column" marginY={1}>
          <Box gap={1}>
            <Text color="red" bold>
              {"✗"}
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
              <Text dimColor>{"\uD83D\uDCA1"} Tip: retry with</Text>
              <Text color={inkColors.accent}>--debug</Text>
              <Text dimColor>to see detailed logs</Text>
            </Box>
          )}
        </Box>
      )}

      <CommandOutput
        stdout={result?.stdout}
        stderr={result?.stderr}
        height={Math.max(3, height - 14 - errorItems.length - (suggestions.length > 0 ? suggestions.length + 4 : 0) - (copyMessage ? 1 : 0))}
        isActive={isInputActive && outputFocused}
      />

      {copyMessage && (
        <Box marginTop={1}>
          <Text color={inkColors.accent}>{copyMessage}</Text>
        </Box>
      )}

      {outputFocused ? (
        <Box marginTop={1}>
          <Text dimColor>j/k scroll · </Text>
          <Text color={inkColors.accent}>Esc</Text>
          <Text dimColor> back to menu</Text>
        </Box>
      ) : (
        <Box marginTop={1} marginBottom={1}>
          <Text bold>What would you like to do?</Text>
          <Text dimColor>  (press </Text>
          <Text color={inkColors.accent}>o</Text>
          <Text dimColor> to scroll output)</Text>
        </Box>
      )}

      <SelectList
        items={errorItems}
        onSelect={async (action) => {
          if (action.startsWith("suggest:")) {
            const rawCmd = action.slice("suggest:".length);
            const parts = rawCmd.split(/\s+/);
            const sugTool = parts[0] as CliToolId;
            const sugArgs = parts.slice(1);
            if (onRunSuggestion) {
              onRunSuggestion(sugTool, sugArgs);
            } else {
              setCurrentArgs(sugArgs);
              setPinMessage(undefined);
              reset();
              setPhase("confirm");
            }
            return;
          }
          switch (action) {
            case "retry":
              setPinMessage(undefined);
              setCopyMessage(undefined);
              reset();
              setPhase("running");
              break;
            case "retry-debug": {
              const newArgs = [...currentArgs, "--debug"];
              setCurrentArgs(newArgs);
              setPinMessage(undefined);
              setCopyMessage(undefined);
              reset();
              setPhase("running");
              break;
            }
            case "run-interactive": {
              const interactiveResult = runInteractive(tool, currentArgs);
              if (
                !interactiveResult.spawnError &&
                interactiveResult.exitCode === 0
              ) {
                setPhase("success");
              }
              break;
            }
            case "copy":
              await copyToClipboard(cmdDisplay);
              setCopyMessage("✓ Command copied to clipboard");
              break;
            case "copy-output": {
              const output = [result?.stdout, result?.stderr].filter(Boolean).join("\n");
              await copyToClipboard(output);
              setCopyMessage("✓ Output copied to clipboard");
              break;
            }
            case "menu":
              (onHome ?? onBack)();
              break;
            case "exit":
              onExit();
              break;
          }
        }}
        onCancel={onBack}
        boxedSections={panelMode}
        width={panelMode ? Math.max(20, width - 4) : width}
        maxVisible={panelMode ? Math.max(errorItems.length + (suggestions.length > 0 ? 4 : 0), height - 6) : undefined}
        isInputActive={isInputActive && !outputFocused}
        arrowNavigation={panelMode}
        panelFocused={isInputActive && !outputFocused}
      />

      {!panelMode && <StatusBar width={width} />}
    </Box>
  );
}
