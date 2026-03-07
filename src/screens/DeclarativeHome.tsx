import React, { useMemo } from "react";
import { Box } from "ink";
import { SelectList } from "../components/SelectList.js";
import type { Screen } from "../data/types.js";
import type { NavigationParams } from "../hooks/useNavigation.js";

interface DeclarativeHomeProps {
  onNavigate: (screen: Screen, params?: NavigationParams) => void;
  onBack: () => void;
  width?: number;
  height?: number;
  isInputActive?: boolean;
}

const ITEMS = [
  { value: "declarative-plan", label: "Plan / Apply", hint: "Diff and apply polter.yaml", kind: "action" as const },
  { value: "declarative-status", label: "Infrastructure Status", hint: "Live state from CLI tools", kind: "action" as const },
  { value: "init-scaffold", label: "Init polter.yaml", hint: "Generate from detected state", kind: "action" as const },
];

export function DeclarativeHome({
  onNavigate,
  onBack,
  width = 80,
  height = 24,
  isInputActive = true,
}: DeclarativeHomeProps): React.ReactElement {
  const handleSelect = useMemo(
    () => (value: string) => onNavigate(value as Screen),
    [onNavigate],
  );

  return (
    <Box flexDirection="column" paddingX={1}>
      <SelectList
        items={ITEMS}
        onSelect={handleSelect}
        onCancel={onBack}
        width={Math.max(20, width - 4)}
        maxVisible={Math.max(6, height - 4)}
        isInputActive={isInputActive}
        arrowNavigation
        panelFocused={isInputActive}
      />
    </Box>
  );
}
