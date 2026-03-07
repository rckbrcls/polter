import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { SelectList, type SelectItem } from "../components/SelectList.js";
import { ConfirmPrompt } from "../components/ConfirmPrompt.js";
import { ToolBadge } from "../components/ToolBadge.js";
import { Divider } from "../components/Divider.js";
import { StatusBar } from "../components/StatusBar.js";
import { ScrollableBox } from "../components/ScrollableBox.js";
import { useCommand } from "../hooks/useCommand.js";
import { useInteractiveRun } from "../hooks/useInteractiveRun.js";
import { isPinnedRun, togglePinnedRun } from "../data/pins.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { parseErrorSuggestions } from "../lib/errorSuggestions.js";
import { stripAnsi } from "../lib/ansi.js";
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
  const [feedback, setFeedback] = useState<string>();
  const [aborting, setAborting] = useState(false);

  const cmdDisplay = rawCommand
    ? `${rawCommand} ${currentArgs.join(" ")}`.trim()
    : `${getToolDisplayName(tool)} ${currentArgs.join(" ")}`;
  const runCommand = currentArgs.join(" ");

  useInput(
    (input, key) => {
      if (key.escape) {
        abort();
        onBack();
        return;
      }
      if (input === "x" && !aborting) {
        abort();
        setAborting(true);
        setFeedback("Aborting...");
        return;
      }
      if (input === "c") {
        const output = [partialStdout, partialStderr].filter(Boolean).join("\n");
        copyToClipboard(output).then(() => setFeedback("Copied to clipboard"));
        return;
      }
    },
    { isActive: isInputActive && phase === "running" },
  );

  useInput(
    (input, _key) => {
      if (input === "/") {
        setOutputFocused((prev) => !prev);
      }
    },
    { isActive: isInputActive && (phase === "error-menu" || phase === "success") },
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

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(undefined), 2000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

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
    const outputText = [partialStdout, partialStderr].filter(Boolean).join("\n");
    const outputLines = outputText
      ? stripAnsi(outputText).split("\n")
      : [];
    // Header (1) + gap (1) + border (2) + feedback (1) + footer gap (1) + footer (1) = 7
    const logBoxHeight = Math.max(3, height - 7);
    const cardWidth = Math.max(30, (panelMode ? width - 4 : width) - 2);

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        {/* Header */}
        <Box marginBottom={1} gap={1}>
          <Text color={inkColors.accent} bold>{"▶"} {cmdDisplay}</Text>
          <ToolBadge tool={tool} />
          <Text color={aborting ? "yellow" : "green"}>● {aborting ? "aborting" : "running"}</Text>
        </Box>

        {/* Output box */}
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={inkColors.accent}
          paddingX={1}
          width={cardWidth}
        >
          <ScrollableBox
            height={logBoxHeight}
            isActive={isInputActive}
            autoScrollToBottom
          >
            {outputLines.length === 0
              ? [<Text key="empty" dimColor>Waiting for output...</Text>]
              : outputLines.map((line, i) => (
                  <Text key={i} wrap="truncate">{line}</Text>
                ))
            }
          </ScrollableBox>
        </Box>

        {/* Feedback */}
        {feedback && (
          <Box>
            <Text color={inkColors.accent}>{feedback}</Text>
          </Box>
        )}

        {/* Footer */}
        <Box marginTop={1} gap={2}>
          <Text dimColor>↑↓:scroll</Text>
          <Text dimColor>x:abort</Text>
          <Text dimColor>c:copy</Text>
          <Text dimColor>Esc:back</Text>
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

    const successOutput = [result?.stdout, result?.stderr].filter(Boolean).join("\n");
    const successLines = successOutput ? stripAnsi(successOutput).split("\n") : [];
    // Header (1) + gap (1) + border (2) + pin msg (1?) + select (~3) + footer (1) = ~9
    const successLogHeight = Math.max(3, height - 9 - (pinMessage ? 1 : 0));
    const successCardWidth = Math.max(30, (panelMode ? width - 4 : width) - 2);

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        {/* Header */}
        <Box marginBottom={1} gap={1}>
          <Text color={inkColors.accent} bold>{"✓"} {cmdDisplay}</Text>
          <ToolBadge tool={tool} />
          <Text color="green">● completed</Text>
        </Box>

        {pinMessage && (
          <Box marginBottom={1}>
            <Text color={inkColors.accent}>{pinMessage}</Text>
          </Box>
        )}

        {/* Output box */}
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={outputFocused ? inkColors.accent : panel.borderDim}
          paddingX={1}
          width={successCardWidth}
        >
          <ScrollableBox
            height={successLogHeight}
            isActive={isInputActive && outputFocused}
            autoScrollToBottom
          >
            {successLines.length === 0
              ? [<Text key="empty" dimColor>No output</Text>]
              : successLines.map((line, i) => (
                  <Text key={i} wrap="truncate">{line}</Text>
                ))
            }
          </ScrollableBox>
        </Box>

        {/* Footer hints */}
        <Box marginTop={1} gap={2}>
          <Text dimColor>/:{outputFocused ? "menu" : "scroll"}</Text>
          {outputFocused && <Text dimColor>↑↓:scroll</Text>}
          <Text dimColor>Esc:back</Text>
        </Box>

        <SelectList
          items={successItems}
          onSelect={onHome ?? onBack}
          onCancel={onHome ?? onBack}
          width={panelMode ? Math.max(20, width - 4) : width}
          maxVisible={panelMode ? Math.max(6, height - 6) : undefined}
          isInputActive={isInputActive && !outputFocused}
          arrowNavigation={panelMode}
          boxedSections={panelMode}
          panelFocused={isInputActive && !outputFocused}
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

  const errorOutput = [result?.stdout, result?.stderr].filter(Boolean).join("\n");
  const errorLines = errorOutput ? stripAnsi(errorOutput).split("\n") : [];
  // Header (1) + gap (1) + border (2) + spawnError extra (~3) + copyMessage (1?) + selectList (~errorItems) + footer
  const errorLogHeight = Math.max(3, height - 8 - Math.min(errorItems.length, 6) - (copyMessage ? 1 : 0));
  const errorCardWidth = Math.max(30, (panelMode ? width - 4 : width) - 2);

  const errorStatusLabel = result?.spawnError
    ? "spawn error"
    : `exit ${result?.exitCode}`;

  return (
    <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
      {/* Header */}
      <Box marginBottom={1} gap={1}>
        <Text color="red" bold>{"✗"} {cmdDisplay}</Text>
        <ToolBadge tool={tool} />
        <Text color="red">● {errorStatusLabel}</Text>
      </Box>

      {result?.spawnError && (
        <Box marginBottom={1}>
          <Text dimColor>Error: </Text>
          <Text color="red">{result.spawnError}</Text>
          {(result.spawnError.includes("ENOENT") ||
            result.spawnError.includes("not found")) && (
            <Text color={inkColors.accent}> — {tool} CLI not found in this repository or PATH</Text>
          )}
        </Box>
      )}

      {!result?.spawnError && !hasDebug && (
        <Box marginBottom={1} gap={1}>
          <Text dimColor>💡 Tip: retry with</Text>
          <Text color={inkColors.accent}>--debug</Text>
          <Text dimColor>to see detailed logs</Text>
        </Box>
      )}

      {/* Output box */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={outputFocused ? "red" : panel.borderDim}
        paddingX={1}
        width={errorCardWidth}
      >
        <ScrollableBox
          height={errorLogHeight}
          isActive={isInputActive && outputFocused}
          autoScrollToBottom
        >
          {errorLines.length === 0
            ? [<Text key="empty" dimColor>No output</Text>]
            : errorLines.map((line, i) => (
                <Text key={i} wrap="truncate">{line}</Text>
              ))
          }
        </ScrollableBox>
      </Box>

      {copyMessage && (
        <Box>
          <Text color={inkColors.accent}>{copyMessage}</Text>
        </Box>
      )}

      {/* Footer hints */}
      <Box marginTop={1} gap={2}>
        <Text dimColor>/:{outputFocused ? "menu" : "scroll"}</Text>
        {outputFocused && <Text dimColor>↑↓:scroll</Text>}
        <Text dimColor>Esc:back</Text>
      </Box>

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
              setAborting(false);
              setFeedback(undefined);
              reset();
              setPhase("running");
              break;
            case "retry-debug": {
              const newArgs = [...currentArgs, "--debug"];
              setCurrentArgs(newArgs);
              setPinMessage(undefined);
              setCopyMessage(undefined);
              setAborting(false);
              setFeedback(undefined);
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
