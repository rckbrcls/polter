import { useState, useCallback } from "react";
import type { Screen, CliToolId } from "../data/types.js";
import type { NavigationParams } from "./useNavigation.js";

export type PanelView =
  | "feature"
  | "pinned"
  | "pipelines"
  | "tool-status"
  | "config"
  | "self-update"
  | "custom-command"
  | "processes"
  | "scripts"
  | "declarative";

export interface PanelNavState {
  view: PanelView;
  featureId: string;
  innerScreen: Screen;
  innerParams: NavigationParams;
  innerStack: Array<{ screen: Screen; params: NavigationParams }>;
}

export function usePanelNavigation() {
  const [state, setState] = useState<PanelNavState>({
    view: "pipelines",
    featureId: "database",
    innerScreen: "home",
    innerParams: {},
    innerStack: [],
  });

  const selectSidebarItem = useCallback((itemId: string) => {
    const featureIds = [
      "database", "functions", "deploy", "repo", "cicd",
      "auth-storage", "networking", "packages", "infrastructure", "setup",
    ];

    if (featureIds.includes(itemId)) {
      setState({
        view: "feature",
        featureId: itemId,
        innerScreen: "home",
        innerParams: {},
        innerStack: [],
      });
      return;
    }

    const viewMap: Record<string, PanelView> = {
      pinned: "pinned",
      "custom-command": "custom-command",
      pipelines: "pipelines",
      "tool-status": "tool-status",
      config: "config",
      "self-update": "self-update",
      processes: "processes",
      scripts: "scripts",
      declarative: "declarative",
    };

    const view = viewMap[itemId];
    if (view) {
      setState({
        view,
        featureId: state.featureId,
        innerScreen: "home",
        innerParams: {},
        innerStack: [],
      });
    }
  }, [state.featureId]);

  const navigateInner = useCallback((screen: Screen, params?: NavigationParams) => {
    setState((prev) => ({
      ...prev,
      innerStack: [...prev.innerStack, { screen: prev.innerScreen, params: prev.innerParams }],
      innerScreen: screen,
      innerParams: params ?? {},
    }));
  }, []);

  const goBackInner = useCallback(() => {
    setState((prev) => {
      if (prev.innerStack.length === 0) {
        return { ...prev, innerScreen: "home", innerParams: {} };
      }
      const newStack = [...prev.innerStack];
      const last = newStack.pop()!;
      return {
        ...prev,
        innerStack: newStack,
        innerScreen: last.screen,
        innerParams: last.params,
      };
    });
  }, []);

  const goHomeInner = useCallback(() => {
    setState((prev) => ({
      ...prev,
      innerScreen: "home",
      innerParams: {},
      innerStack: [],
    }));
  }, []);

  const switchViewAndNavigate = useCallback(
    (view: PanelView, screen: Screen, params?: NavigationParams) => {
      setState((prev) => ({
        ...prev,
        view,
        innerScreen: screen,
        innerParams: params ?? {},
        innerStack: [{ screen: "home", params: {} }],
      }));
    },
    [],
  );

  return {
    ...state,
    selectSidebarItem,
    navigateInner,
    goBackInner,
    goHomeInner,
    switchViewAndNavigate,
  };
}
