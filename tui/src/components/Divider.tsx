import React from "react";
import { Text } from "ink";

interface DividerProps {
  label?: string;
  width?: number;
}

export function Divider({
  label,
  width,
}: DividerProps): React.ReactElement {
  const effectiveWidth = width ?? (process.stdout.columns ?? 50);

  if (label) {
    const labelLen = label.length + 2; // space padding
    const sideLen = Math.max(2, Math.floor((effectiveWidth - labelLen) / 2));
    const left = "─".repeat(sideLen);
    const right = "─".repeat(sideLen);

    return (
      <Text dimColor>
        {left} {label} {right}
      </Text>
    );
  }

  return <Text dimColor>{"─".repeat(effectiveWidth)}</Text>;
}
