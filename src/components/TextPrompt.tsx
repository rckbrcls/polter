import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInputComponent from "ink-text-input";
import { inkColors } from "../theme.js";

interface TextPromptProps {
  label: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  onCancel?: () => void;
  validate?: (value: string) => string | undefined;
}

export function TextPrompt({
  label,
  placeholder,
  onSubmit,
  onCancel,
  validate,
}: TextPromptProps): React.ReactElement {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();

  useInput((_input, key) => {
    if (key.escape && onCancel) {
      onCancel();
    }
  });

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

  return (
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
}
