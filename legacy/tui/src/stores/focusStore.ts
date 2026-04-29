import { create } from "zustand";

export type FocusedPanel = "sidebar" | "main";

export interface FocusState {
  focused: FocusedPanel;
  isSidebarFocused: boolean;
  isMainFocused: boolean;
}

export interface FocusActions {
  toggleFocus: () => void;
  focusSidebar: () => void;
  focusMain: () => void;
}

export const useFocusStore = create<FocusState & FocusActions>((set) => ({
  focused: "sidebar",
  isSidebarFocused: true,
  isMainFocused: false,

  toggleFocus: () => {
    set((state) => {
      const next = state.focused === "sidebar" ? "main" : "sidebar";
      return {
        focused: next,
        isSidebarFocused: next === "sidebar",
        isMainFocused: next === "main",
      };
    });
  },

  focusSidebar: () => {
    set({ focused: "sidebar", isSidebarFocused: true, isMainFocused: false });
  },

  focusMain: () => {
    set({ focused: "main", isSidebarFocused: false, isMainFocused: true });
  },
}));
