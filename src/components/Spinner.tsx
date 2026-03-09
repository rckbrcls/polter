import React from "react";
import { Text } from "ink";
import InkSpinner from "ink-spinner";
import { inkColors } from "../theme.js";
import type InkSpinnerComponent from "ink-spinner";

type InkSpinnerProps = Parameters<typeof InkSpinnerComponent>[0];

interface SpinnerProps {
  label?: string;
  color?: string;
  spinnerType?: InkSpinnerProps["type"];
}

export function Spinner({
  label = "Running...",
  color = inkColors.accent,
  spinnerType = "dots",
}: SpinnerProps): React.ReactElement {
  return (
    <Text>
      <Text color={color}>
        <InkSpinner type={spinnerType} />
      </Text>
      {" "}
      <Text>{label}</Text>
    </Text>
  );
}
