import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInputComponent from "ink-text-input";
import { inkColors, panel } from "../theme.js";

interface TextPromptProps {
  label: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  onCancel?: () => void;
  validate?: (value: string) => string | undefined;
  arrowNavigation?: boolean;
  isInputActive?: boolean;
  boxed?: boolean;
  focused?: boolean;
}

export function TextPrompt({
  label,
  placeholder,
  onSubmit,
  onCancel,
  validate,
  arrowNavigation = false,
  isInputActive = true,
  boxed = false,
  focused = true,
}: TextPromptProps): React.ReactElement {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();

  useInput((_input, key) => {
    if (key.escape && onCancel) {
      onCancel();
    }
    if (arrowNavigation && key.leftArrow && value === "" && onCancel) {
      onCancel();
    }
    if (arrowNavigation && key.rightArrow) {
      handleSubmit(value);
    }
  }, { isActive: isInputActive });

  const handleSubmit = (val: string) => {
    if (validate) {
      const err = validate(val);
      if (err) {
        setError(err);
        return;
      }
    }
    setError(undefined);
    onSubmit(val);
  };

  const content = (
    <Box flexDirection="column">
      <Box gap={1}>
        <Text color={inkColors.accent} bold>
          ?
        </Text>
        <Text>{label}</Text>
      </Box>
      <Box gap={1} marginLeft={2}>
        <Text color={inkColors.accent}>❯</Text>
        <TextInputComponent
          value={value}
          onChange={(val) => {
            setValue(val);
            setError(undefined);
          }}
          onSubmit={handleSubmit}
          placeholder={placeholder}
        />
      </Box>
      {error && (
        <Box marginLeft={2}>
          <Text color="red">✗ {error}</Text>
        </Box>
      )}
    </Box>
  );

  if (boxed) {
    return (
      <Box borderStyle="round" borderColor={focused ? inkColors.accent : panel.borderDim} paddingX={1}>
        {content}
      </Box>
    );
  }

  return content;
}
