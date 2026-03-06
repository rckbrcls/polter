import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { ConfirmPrompt } from "../components/ConfirmPrompt.js";
import { Divider } from "../components/Divider.js";
import { SelectList } from "../components/SelectList.js";
import { Spinner } from "../components/Spinner.js";
import { StatusBar } from "../components/StatusBar.js";
import { useCommand } from "../hooks/useCommand.js";
import { findNearestPackageRoot } from "../lib/packageRoot.js";
import { inkColors } from "../theme.js";

interface SelfUpdateProps {
  onBack: () => void;
  onExit: () => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type Phase = "target" | "confirm" | "running" | "success" | "error";
type UpdateTarget = "repository" | "global";

const packageName = "@polterware/polter";
const globalUpdateArgs = ["install", "-g", `${packageName}@latest`];
const repositoryUpdateArgs = ["install", "-D", `${packageName}@latest`];

function getUpdateArgs(target: UpdateTarget): string[] {
  return target === "repository" ? repositoryUpdateArgs : globalUpdateArgs;
}

export function SelfUpdate({
  onBack,
  onExit,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: SelfUpdateProps): React.ReactElement {
  const repositoryRoot = findNearestPackageRoot();
  const [target, setTarget] = useState<UpdateTarget>(
    repositoryRoot ? "repository" : "global",
  );
  const [phase, setPhase] = useState<Phase>(
    repositoryRoot ? "target" : "confirm",
  );
  const updateArgs = getUpdateArgs(target);
  const updateDisplay = `npm ${updateArgs.join(" ")}`;
  const updateCwd =
    target === "repository" && repositoryRoot ? repositoryRoot : process.cwd();
  const { status, result, run, reset } = useCommand("npm", updateCwd);

  useEffect(() => {
    if (phase === "running" && status === "idle") {
      run(updateArgs);
    }
  }, [phase, run, status, updateArgs]);

  useEffect(() => {
    if (phase === "running" && status === "success") {
      setPhase("success");
    }

    if (phase === "running" && status === "error") {
      setPhase("error");
    }
  }, [phase, status]);

  if (phase === "target") {
    const targetItems = [
      { value: "__section__", label: "📦 Update Target", kind: "header" as const, selectable: false },
      {
        value: "repository",
        label: "Current repository",
        hint: "Pin the latest version in package.json",
        kind: "action" as const,
      },
      {
        value: "global",
        label: "Global install",
        hint: "Update the shared version available in PATH",
        kind: "action" as const,
      },
      ...(!panelMode ? [{ value: "back", label: "← Back to menu" }] : []),
    ];

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Box marginBottom={1}>
          <Text bold>Choose where to update Polter.</Text>
        </Box>

        <SelectList
          items={targetItems}
          onSelect={(value) => {
            if (value === "back") {
              onBack();
              return;
            }

            setTarget(value as UpdateTarget);
            reset();
            setPhase("confirm");
          }}
          onCancel={onBack}
          boxedSections={panelMode}
          width={panelMode ? Math.max(20, width - 4) : width}
          maxVisible={panelMode ? Math.max(6, height - 6) : undefined}
          isInputActive={isInputActive}
          arrowNavigation={panelMode}
        />

        {repositoryRoot && (
          <Box marginTop={1} marginLeft={2}>
            <Text dimColor>Repository root: {repositoryRoot}</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (phase === "confirm") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <ConfirmPrompt
          message={`Run ${updateDisplay}?`}
          defaultValue={true}
          onConfirm={(confirmed) => {
            if (confirmed) {
              reset();
              setPhase("running");
              return;
            }

            if (repositoryRoot) {
              setPhase("target");
              return;
            }

            onBack();
          }}
        />
        <Box marginTop={1} marginLeft={2} flexDirection="column">
          <Text dimColor>
            {target === "repository"
              ? "This updates the dependency in the current repository."
              : "This updates the global npm install."}
          </Text>
          {target === "repository" && repositoryRoot && (
            <Text dimColor>Run location: {repositoryRoot}</Text>
          )}
        </Box>
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
          <Text>{updateDisplay}</Text>
        </Box>
        <Divider width={panelMode ? width - 4 : width} />
        <Box marginTop={1}>
          <Spinner label="Updating Polter..." />
        </Box>
      </Box>
    );
  }

  if (phase === "success") {
    const successItems = [
      { value: "__section__", label: "✅ Update Complete", kind: "header" as const, selectable: false },
      ...(!panelMode ? [{ value: "__back__", label: "← Back to menu", kind: "action" as const }] : []),
      { value: "__exit__", label: "🚪 Exit Polter", kind: "action" as const },
    ];

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Divider width={panelMode ? width - 4 : width} />
        <Box marginY={1} gap={1}>
          <Text color={inkColors.accent} bold>
            ✓
          </Text>
          <Text color={inkColors.accent} bold>
            Update completed successfully!
          </Text>
        </Box>
        <Box marginBottom={1} marginLeft={2} flexDirection="column">
          <Text dimColor>Restart Polter to use the latest version.</Text>
          {target === "repository" && repositoryRoot && (
            <Text dimColor>Repository updated in: {repositoryRoot}</Text>
          )}
        </Box>
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
        />
      </Box>
    );
  }

  const errorItems = [
    { value: "__section__", label: "🔧 Recovery Options", kind: "header" as const, selectable: false },
    { value: "retry", label: "🔄 Retry update", kind: "action" as const },
    ...(repositoryRoot
      ? [{ value: "target", label: "↔ Choose update target", kind: "action" as const }]
      : []),
    ...(!panelMode ? [{ value: "menu", label: "← Return to main menu", kind: "action" as const }] : []),
    { value: "exit", label: "🚪 Exit Polter", kind: "action" as const },
  ];

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
              ✗
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

      <Box marginBottom={1} marginLeft={2} flexDirection="column">
        <Text dimColor>Manual fallback:</Text>
        <Text color={inkColors.accent}>{updateDisplay}</Text>
        {target === "repository" && repositoryRoot && (
          <Text dimColor>Run location: {repositoryRoot}</Text>
        )}
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
            case "target":
              reset();
              setPhase("target");
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
