import React from "react";
import { Box, Text } from "ink";
import { FlagToggle } from "../components/FlagToggle.js";
import { StatusBar } from "../components/StatusBar.js";
import { getFlagsForTool } from "../data/flags.js";
import { inkColors, panel } from "../theme.js";
import type { NavigationParams, Screen } from "../hooks/useNavigation.js";
import type { CliToolId } from "../data/types.js";

interface FlagSelectionProps {
  args: string[];
  tool?: CliToolId;
  interactive?: boolean;
  onNavigate: (screen: Screen, params?: NavigationParams) => void;
  onBack: () => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

export function FlagSelection({
  args,
  tool = "supabase",
  interactive,
  onNavigate,
  onBack,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: FlagSelectionProps): React.ReactElement {
  const flags = getFlagsForTool(tool);

  if (flags.length === 0) {
    // No flags for this tool, go straight to execution
    onNavigate("confirm-execute", { args, tool, interactive });
    return <Box />;
  }

  const cmdDisplay = `${tool} ${args.join(" ")}`;

  return (
    <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
      {panelMode && (
        <Box marginBottom={1} gap={1}>
          <Text color={inkColors.accent} bold>
            {"▶"} {cmdDisplay}
          </Text>
        </Box>
      )}

      {panelMode ? (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={isInputActive ? inkColors.accent : panel.borderDim}
          borderDimColor
          paddingX={1}
        >
          <FlagToggle
            flags={flags}
            onSubmit={(selectedFlags) => {
              const finalArgs =
                selectedFlags.length > 0
                  ? [...args, ...selectedFlags]
                  : args;
              onNavigate("confirm-execute", { args: finalArgs, tool, interactive });
            }}
            onCancel={onBack}
            isInputActive={isInputActive}
            arrowNavigation={panelMode}
          />
        </Box>
      ) : (
        <FlagToggle
          flags={flags}
          onSubmit={(selectedFlags) => {
            const finalArgs =
              selectedFlags.length > 0
                ? [...args, ...selectedFlags]
                : args;
            onNavigate("confirm-execute", { args: finalArgs, tool, interactive });
          }}
          onCancel={onBack}
          isInputActive={isInputActive}
          arrowNavigation={panelMode}
        />
      )}

      {!panelMode && <StatusBar hint="Space toggle · Enter confirm · Esc back" width={width} />}
    </Box>
  );
}
