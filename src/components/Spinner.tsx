import React from "react";
import { Text } from "ink";
import InkSpinner from "ink-spinner";
import { inkColors } from "../theme.js";

interface SpinnerProps {
  label?: string;
  color?: string;
}

export function Spinner({
  label = "Running...",
  color = inkColors.accent,
}: SpinnerProps): React.ReactElement {
  return (
    <Text>
      <Text color={color}>
        <InkSpinner type="dots" />
      </Text>
      {" "}
      <Text>{label}</Text>
    </Text>
  );
}
