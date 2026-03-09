import { create } from "zustand";
import {
  getPinnedCommands,
  getPinnedRuns,
  togglePinnedCommand,
  togglePinnedRun,
} from "../data/pins.js";

interface PinState {
  pinnedCommands: string[];
  pinnedRuns: string[];
  pinnedCommandSet: Set<string>;
  pinnedRunSet: Set<string>;
  pinFeedback: string | undefined;
}

interface PinActions {
  togglePinCommand: (commandId: string) => void;
  togglePinRun: (runId: string) => void;
  refreshPins: () => void;
  clearFeedback: () => void;
}

function loadPins() {
  const pinnedCommands = getPinnedCommands();
  const pinnedRuns = getPinnedRuns();
  return {
    pinnedCommands,
    pinnedRuns,
    pinnedCommandSet: new Set(pinnedCommands),
    pinnedRunSet: new Set(pinnedRuns),
  };
}

export const usePinStore = create<PinState & PinActions>((set, get) => ({
  ...loadPins(),
  pinFeedback: undefined,

  togglePinCommand: (commandId) => {
    const wasPinned = get().pinnedCommandSet.has(commandId);
    togglePinnedCommand(commandId);
    set({
      ...loadPins(),
      pinFeedback: wasPinned ? `Unpinned "${commandId}"` : `Pinned "${commandId}"`,
    });
  },

  togglePinRun: (runId) => {
    const wasPinned = get().pinnedRunSet.has(runId);
    togglePinnedRun(runId);
    set({
      ...loadPins(),
      pinFeedback: wasPinned ? `Unpinned run "${runId}"` : `Pinned run "${runId}"`,
    });
  },

  refreshPins: () => {
    set(loadPins());
  },

  clearFeedback: () => {
    set({ pinFeedback: undefined });
  },
}));
