import { create } from "zustand";
import type { Screen, CliToolId } from "../data/types.js";
import type { NavigationParams } from "../hooks/useNavigation.js";

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
  | "declarative"
  | "skill-setup";

export interface NavigationState {
  view: PanelView;
  featureId: string;
  innerScreen: Screen;
  innerParams: NavigationParams;
  innerStack: Array<{ screen: Screen; params: NavigationParams }>;
}

export interface NavigationActions {
  selectSidebarItem: (itemId: string) => void;
  navigateInner: (screen: Screen, params?: NavigationParams) => void;
  goBackInner: () => void;
  goHomeInner: () => void;
  switchViewAndNavigate: (view: PanelView, screen: Screen, params?: NavigationParams) => void;
}

const FEATURE_IDS = [
  "database", "functions", "deploy", "repo", "cicd",
  "auth-storage", "networking", "packages", "infrastructure", "setup",
];

const VIEW_MAP: Record<string, PanelView> = {
  pinned: "pinned",
  "custom-command": "custom-command",
  pipelines: "pipelines",
  "tool-status": "tool-status",
  config: "config",
  "self-update": "self-update",
  processes: "processes",
  scripts: "scripts",
  declarative: "declarative",
  "skill-setup": "skill-setup",
};

export const useNavigationStore = create<NavigationState & NavigationActions>((set) => ({
  view: "pipelines",
  featureId: "database",
  innerScreen: "home",
  innerParams: {},
  innerStack: [],

  selectSidebarItem: (itemId) => {
    if (FEATURE_IDS.includes(itemId)) {
      set({
        view: "feature",
        featureId: itemId,
        innerScreen: "home",
        innerParams: {},
        innerStack: [],
      });
      return;
    }

    const view = VIEW_MAP[itemId];
    if (view) {
      set((state) => ({
        view,
        featureId: state.featureId,
        innerScreen: "home",
        innerParams: {},
        innerStack: [],
      }));
    }
  },

  navigateInner: (screen, params) => {
    set((state) => ({
      innerStack: [...state.innerStack, { screen: state.innerScreen, params: state.innerParams }],
      innerScreen: screen,
      innerParams: params ?? {},
    }));
  },

  goBackInner: () => {
    set((state) => {
      if (state.innerStack.length === 0) {
        return { innerScreen: "home" as Screen, innerParams: {} };
      }
      const newStack = [...state.innerStack];
      const last = newStack.pop()!;
      return {
        innerStack: newStack,
        innerScreen: last.screen,
        innerParams: last.params,
      };
    });
  },

  goHomeInner: () => {
    set({ innerScreen: "home", innerParams: {}, innerStack: [] });
  },

  switchViewAndNavigate: (view, screen, params) => {
    set({
      view,
      innerScreen: screen,
      innerParams: params ?? {},
      innerStack: [{ screen: "home" as Screen, params: {} }],
    });
  },
}));
