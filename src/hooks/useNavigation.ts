import { useState, useCallback } from "react";
import type { Screen, CliToolId } from "../data/types.js";

export type { Screen };

export interface NavigationParams {
  command?: string;
  commandId?: string;
  tool?: CliToolId;
  args?: string[];
  flags?: string[];
  featureId?: string;
  pipelineId?: string;
  processId?: string;
  interactive?: boolean;
  rawCommand?: string;
}

export interface NavigationState {
  screen: Screen;
  params: NavigationParams;
}

export function useNavigation() {
  const [stack, setStack] = useState<NavigationState[]>([
    { screen: "home", params: {} },
  ]);

  const current = stack[stack.length - 1]!;

  const navigate = useCallback((screen: Screen, params?: NavigationParams) => {
    setStack((prev) => [...prev, { screen, params: params ?? {} }]);
  }, []);

  const goBack = useCallback(() => {
    setStack((prev) => {
      if (prev.length <= 1) return [{ screen: "home", params: {} }];
      return prev.slice(0, -1);
    });
  }, []);

  const goHome = useCallback(() => {
    setStack([{ screen: "home", params: {} }]);
  }, []);

  return {
    screen: current.screen,
    params: current.params,
    navigate,
    goBack,
    goHome,
  };
}
