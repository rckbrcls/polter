import { useTerminalDimensions } from "./useTerminalDimensions.js";

export function useTerminalHeight(): number {
  return useTerminalDimensions().height;
}
