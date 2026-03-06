import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { inkColors } from "../theme.js";

interface FlagToggleProps {
  flags: { value: string; label: string; hint?: string }[];
  onSubmit: (selected: string[]) => void;
  onCancel?: () => void;
  isInputActive?: boolean;
  arrowNavigation?: boolean;
}

export function FlagToggle({
  flags,
  onSubmit,
  onCancel,
  isInputActive = true,
  arrowNavigation = false,
}: FlagToggleProps): React.ReactElement {
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      setCursor((prev) => (prev > 0 ? prev - 1 : flags.length - 1));
    }

    if (key.downArrow || input === "j") {
      setCursor((prev) => (prev < flags.length - 1 ? prev + 1 : 0));
    }

    if (input === " ") {
      setSelected((prev) => {
        const next = new Set(prev);
        const flag = flags[cursor]!;
        if (next.has(flag.value)) {
          next.delete(flag.value);
        } else {
          next.add(flag.value);
        }
        return next;
      });
    }

    if (key.return) {
      onSubmit(Array.from(selected));
    }

    if (key.escape && onCancel) {
      onCancel();
    }

    if (arrowNavigation && key.leftArrow && onCancel) {
      onCancel();
    }
  }, { isActive: isInputActive });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={inkColors.accent}>
          ⚑ Global Flags
        </Text>
        <Text dimColor> (Space to toggle, Enter to confirm)</Text>
      </Box>

      {flags.map((flag, i) => {
        const isActive = cursor === i;
        const isChecked = selected.has(flag.value);

        return (
          <Box key={flag.value} gap={1}>
            <Text color={isActive ? inkColors.accent : undefined}>
              {isActive ? "❯" : " "}
            </Text>
            <Text
              color={
                isChecked || isActive ? inkColors.accent : undefined
              }
              bold={isChecked}
            >
              {isChecked ? "◉" : "○"}
            </Text>
            <Text
              color={isActive ? inkColors.accent : undefined}
              bold={isActive}
            >
              {flag.label}
            </Text>
            {flag.hint && <Text dimColor>{flag.hint}</Text>}
          </Box>
        );
      })}

      <Box marginTop={1}>
        <Text dimColor>
          {selected.size > 0
            ? `${selected.size} flag${selected.size > 1 ? "s" : ""} selected`
            : "No flags selected (Enter to skip)"}
        </Text>
      </Box>
    </Box>
  );
}
