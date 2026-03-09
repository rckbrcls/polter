import { useEffect } from "react";
import ms from "ms";
import { usePinStore } from "../stores/pinStore.js";
import type { SelectItem } from "../components/SelectList.js";

export function usePinAction(onPinsChanged?: () => void) {
  const store = usePinStore();

  useEffect(() => {
    store.refreshPins();
  }, []);

  useEffect(() => {
    if (!store.pinFeedback) return;
    const timeout = setTimeout(() => store.clearFeedback(), ms("1.4s"));
    return () => clearTimeout(timeout);
  }, [store.pinFeedback]);

  const handleRightAction = (item: SelectItem) => {
    if (item.kind === "command") {
      store.togglePinCommand(item.value);
      onPinsChanged?.();
      return;
    }
    if (item.kind === "run") {
      store.togglePinRun(item.value);
      onPinsChanged?.();
    }
  };

  return {
    pinnedCommands: store.pinnedCommands,
    pinnedRuns: store.pinnedRuns,
    pinnedCommandSet: store.pinnedCommandSet,
    pinnedRunSet: store.pinnedRunSet,
    pinFeedback: store.pinFeedback,
    handleRightAction,
    refreshPins: store.refreshPins,
  };
}
