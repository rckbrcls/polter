import { useFocusStore, type FocusedPanel } from "../stores/focusStore.js";

export type { FocusedPanel };

export function usePanelFocus() {
  return useFocusStore();
}
