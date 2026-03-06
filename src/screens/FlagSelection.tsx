import React from "react";
import { Box } from "ink";
import { FlagToggle } from "../components/FlagToggle.js";
import { StatusBar } from "../components/StatusBar.js";
import { getFlagsForTool } from "../data/flags.js";
import type { NavigationParams, Screen } from "../hooks/useNavigation.js";
import type { CliToolId } from "../data/types.js";

interface FlagSelectionProps {
  args: string[];
  tool?: CliToolId;
  onNavigate: (screen: Screen, params?: NavigationParams) => void;
  onBack: () => void;
  width?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

export function FlagSelection({
  args,
  tool = "supabase",
  onNavigate,
  onBack,
  width = 80,
  panelMode = false,
  isInputActive = true,
}: FlagSelectionProps): React.ReactElement {
  const flags = getFlagsForTool(tool);

  if (flags.length === 0) {
    // No flags for this tool, go straight to execution
    onNavigate("confirm-execute", { args, tool });
    return <Box />;
  }

  return (
    <Box flexDirection="column">
      <FlagToggle
        flags={flags}
        onSubmit={(selectedFlags) => {
          const finalArgs =
            selectedFlags.length > 0
              ? [...args, ...selectedFlags]
              : args;
          onNavigate("confirm-execute", { args: finalArgs, tool });
        }}
        onCancel={onBack}
        isInputActive={isInputActive}
        arrowNavigation={panelMode}
      />

      {!panelMode && <StatusBar hint="Space toggle · Enter confirm · Esc back" width={width} />}
    </Box>
  );
}
