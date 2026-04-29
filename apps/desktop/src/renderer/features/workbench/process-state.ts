import type { ProcessInfo, ProcessOutput } from "./types.js";

export const PROCESS_LOG_TAIL = 80;
export const PROCESS_LOG_MAX_CHARACTERS = 60_000;
export const PROCESS_LOG_TRUNCATION_NOTICE =
  "Older log output was truncated to keep the UI responsive.";

export function resolveProcessSelection(
  processes: ProcessInfo[],
  selectedProcessId: string,
): string {
  if (selectedProcessId && processes.some((processInfo) => processInfo.id === selectedProcessId)) {
    return selectedProcessId;
  }

  return processes[0]?.id ?? "";
}

export function formatProcessOutput(
  processLogs: ProcessOutput | null,
  maxCharacters = PROCESS_LOG_MAX_CHARACTERS,
): string {
  if (!processLogs) {
    return "";
  }

  const output = [...processLogs.stdout, ...processLogs.stderr].join("\n");
  if (output.length <= maxCharacters) {
    return output;
  }

  return `${PROCESS_LOG_TRUNCATION_NOTICE}\n\n${output.slice(-maxCharacters)}`;
}
