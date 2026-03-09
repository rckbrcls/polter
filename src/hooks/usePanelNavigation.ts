import { useNavigationStore, type PanelView, type NavigationState } from "../stores/navigationStore.js";

export type { PanelView };
export type PanelNavState = NavigationState;

export function usePanelNavigation() {
  return useNavigationStore();
}
