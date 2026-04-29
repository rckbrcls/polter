import { describe, expect, it } from "vitest";
import type { ProcessInfo, ProcessOutput } from "./types.js";
import {
  PROCESS_LOG_TRUNCATION_NOTICE,
  formatProcessOutput,
  resolveProcessSelection,
} from "./process-state.js";

function processInfo(id: string): ProcessInfo {
  return {
    id,
    command: "pnpm",
    args: ["test"],
    cwd: "/workspace",
    pid: 123,
    status: "running",
    exitCode: null,
    signal: null,
    startedAt: "2026-04-24T00:00:00.000Z",
    exitedAt: null,
    uptime: 1000,
  };
}

function processOutput(stdout: string[], stderr: string[] = []): ProcessOutput {
  return {
    stdout,
    stderr,
    stdoutLineCount: stdout.length,
    stderrLineCount: stderr.length,
  };
}

describe("process state helpers", () => {
  it("keeps the selected process when it still exists", () => {
    expect(resolveProcessSelection([processInfo("first"), processInfo("second")], "second")).toBe(
      "second",
    );
  });

  it("falls back to the first process when the selected process is stale", () => {
    expect(resolveProcessSelection([processInfo("first"), processInfo("second")], "missing")).toBe(
      "first",
    );
  });

  it("clears the selection when there are no processes", () => {
    expect(resolveProcessSelection([], "missing")).toBe("");
  });

  it("formats stdout and stderr without truncation when output is small", () => {
    expect(formatProcessOutput(processOutput(["ready"], ["warning"]))).toBe("ready\nwarning");
  });

  it("truncates large log output from the start", () => {
    const formatted = formatProcessOutput(processOutput(["0123456789"]), 4);

    expect(formatted).toBe(`${PROCESS_LOG_TRUNCATION_NOTICE}\n\n6789`);
  });
});
