import { useTerminalDimensions } from "./useTerminalDimensions.js";

export function useTerminalWidth(): number {
  return useTerminalDimensions().width;
}
