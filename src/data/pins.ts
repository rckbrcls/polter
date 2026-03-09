import { getConf } from "../config/globalConf.js";

const COMMAND_PINS_KEY = "pinnedCommandBasesV2";
const RUN_PINS_KEY = "pinnedCommandRunsV1";
const LEGACY_PINS_KEY = "pinnedCommands";

function ensurePinsInitialized(): void {
  const config = getConf();
  if (!config.has(COMMAND_PINS_KEY)) {
    config.set(COMMAND_PINS_KEY, []);
  }

  if (!config.has(RUN_PINS_KEY)) {
    config.set(RUN_PINS_KEY, []);
  }

  // Explicit reset strategy for old pin model (full command pins).
  if (config.has(LEGACY_PINS_KEY)) {
    config.delete(LEGACY_PINS_KEY);
  }
}

export function getPinnedCommands(): string[] {
  ensurePinsInitialized();
  return (getConf().get(COMMAND_PINS_KEY) as string[]) || [];
}

function setPinnedCommands(commands: string[]): void {
  getConf().set(COMMAND_PINS_KEY, commands);
}

export function togglePinnedCommand(cmd: string): void {
  ensurePinsInitialized();
  const current = getPinnedCommands();
  if (current.includes(cmd)) {
    setPinnedCommands(current.filter((c) => c !== cmd));
    return;
  }

  // Newer pins always appear first.
  setPinnedCommands([cmd, ...current.filter((c) => c !== cmd)]);
}

export function isPinnedCommand(cmd: string): boolean {
  return getPinnedCommands().includes(cmd);
}

export function getPinnedRuns(): string[] {
  ensurePinsInitialized();
  return (getConf().get(RUN_PINS_KEY) as string[]) || [];
}

function setPinnedRuns(runs: string[]): void {
  getConf().set(RUN_PINS_KEY, runs);
}

export function togglePinnedRun(runCommand: string): void {
  ensurePinsInitialized();
  const current = getPinnedRuns();
  if (current.includes(runCommand)) {
    setPinnedRuns(current.filter((run) => run !== runCommand));
    return;
  }

  setPinnedRuns([runCommand, ...current.filter((run) => run !== runCommand)]);
}

export function isPinnedRun(runCommand: string): boolean {
  return getPinnedRuns().includes(runCommand);
}

export function __clearPinsForTests(): void {
  setPinnedCommands([]);
  setPinnedRuns([]);
  getConf().delete(LEGACY_PINS_KEY);
}

export function __setLegacyPinsForTests(commands: string[]): void {
  const config = getConf();
  config.delete(COMMAND_PINS_KEY);
  config.delete(RUN_PINS_KEY);
  config.set(LEGACY_PINS_KEY, commands);
}
