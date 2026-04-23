import { useState } from "react";
import { useInput } from "ink";

export function useOutputFocus(isInputActive: boolean) {
  const [outputFocused, setOutputFocused] = useState(false);

  useInput(
    (input) => {
      if (input === "/") {
        setOutputFocused((prev) => !prev);
      }
    },
    { isActive: isInputActive },
  );

  return { outputFocused, setOutputFocused };
}
