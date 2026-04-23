import React from "react";
import { Box, Text, useInput } from "ink";
import { inkColors } from "../theme.js";

interface ConfirmPromptProps {
  message: string;
  defaultValue?: boolean;
  onConfirm: (value: boolean) => void;
  onCancel?: () => void;
  isInputActive?: boolean;
  arrowNavigation?: boolean;
}

export function ConfirmPrompt({
  message,
  defaultValue = true,
  onConfirm,
  onCancel,
  isInputActive = true,
  arrowNavigation = false,
}: ConfirmPromptProps): React.ReactElement {
  useInput((input, key) => {
    if (key.escape && onCancel) {
      onCancel();
      return;
    }
    if (arrowNavigation && key.leftArrow && onCancel) {
      onCancel();
      return;
    }
    if (input === "y" || input === "Y") {
      onConfirm(true);
    } else if (input === "n" || input === "N") {
      onConfirm(false);
    } else if (input === "\r") {
      onConfirm(defaultValue);
    }
  }, { isActive: isInputActive });

  return (
    <Box gap={1}>
      <Text color={inkColors.accent} bold>
        ?
      </Text>
      <Text>{message}</Text>
      <Text dimColor>
        {defaultValue ? "(Y/n)" : "(y/N)"}
      </Text>
    </Box>
  );
}
