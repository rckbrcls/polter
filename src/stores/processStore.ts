import { create } from "zustand";
import { listProcesses, type ProcessInfo } from "../lib/processManager.js";

interface ProcessState {
  processes: ProcessInfo[];
  selectedIndex: number;
}

interface ProcessActions {
  refresh: () => void;
  setSelectedIndex: (index: number) => void;
  clampIndex: () => void;
}

export const useProcessStore = create<ProcessState & ProcessActions>((set, get) => ({
  processes: [],
  selectedIndex: 0,

  refresh: () => {
    const processes = listProcesses();
    const state = get();
    const clamped = state.selectedIndex >= processes.length && processes.length > 0
      ? processes.length - 1
      : state.selectedIndex;
    set({ processes, selectedIndex: clamped });
  },

  setSelectedIndex: (index) => {
    set({ selectedIndex: index });
  },

  clampIndex: () => {
    const { processes, selectedIndex } = get();
    if (selectedIndex >= processes.length && processes.length > 0) {
      set({ selectedIndex: processes.length - 1 });
    }
  },
}));
