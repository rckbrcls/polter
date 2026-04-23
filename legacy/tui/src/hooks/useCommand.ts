import { useState, useCallback, useRef, useEffect } from "react";
import {
  runCommand,
  type CommandExecution,
  type RunResult,
} from "../lib/runner.js";
import { resolveToolCommand } from "../lib/toolResolver.js";
import { registerForegroundProcess, generateProcessId } from "../lib/processManager.js";
import { CLI_TOOL_IDS, type CliToolId } from "../data/types.js";

export type CommandStatus = "idle" | "running" | "success" | "error";

export function useCommand(
  execution: string | CliToolId | CommandExecution = "supabase",
  cwd: string = process.cwd(),
  options?: { quiet?: boolean },
) {
  const [status, setStatus] = useState<CommandStatus>("idle");
  const [result, setResult] = useState<RunResult | null>(null);
  const [partialStdout, setPartialStdout] = useState("");
  const [partialStderr, setPartialStderr] = useState("");
  const [pid, setPid] = useState<number | undefined>();
  const [processId, setProcessId] = useState<string | undefined>();
  const [startedAt, setStartedAt] = useState<Date | undefined>();
  const abortRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.();
      abortRef.current = null;
    };
  }, []);

  const run = useCallback(async (args: string[]) => {
    setStatus("running");
    setResult(null);
    setPartialStdout("");
    setPartialStderr("");
    setPid(undefined);
    setProcessId(undefined);
    setStartedAt(new Date());

    let resolvedExecution: string | CommandExecution;

    if (typeof execution === "string") {
      if ((CLI_TOOL_IDS as readonly string[]).includes(execution)) {
        const resolved = resolveToolCommand(execution as CliToolId, cwd);
        resolvedExecution = { command: resolved.command, env: resolved.env };
      } else {
        resolvedExecution = execution;
      }
    } else {
      resolvedExecution = execution;
    }

    const onData = (stdout: string, stderr: string) => {
      setPartialStdout(stdout);
      setPartialStderr(stderr);
    };
    const runOpts = { quiet: options?.quiet, onData };
    const handle = runCommand(resolvedExecution, args, cwd, runOpts);
    abortRef.current = handle.abort;

    const cmdStr = typeof resolvedExecution === "string" ? resolvedExecution : resolvedExecution.command;
    const procId = generateProcessId(cmdStr, args);
    try {
      registerForegroundProcess(procId, cmdStr, args, cwd, handle.subprocess);
    } catch { /* don't break TUI flow */ }
    setPid(handle.pid);
    setProcessId(procId);
    const res = await handle.promise;
    abortRef.current = null;
    setResult(res);

    if (res.spawnError || (res.exitCode !== null && res.exitCode !== 0)) {
      setStatus("error");
    } else {
      setStatus("success");
    }

    return res;
  }, [cwd, execution, options?.quiet]);

  const abort = useCallback(() => {
    abortRef.current?.();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setPartialStdout("");
    setPartialStderr("");
    setPid(undefined);
    setProcessId(undefined);
    setStartedAt(undefined);
  }, []);

  return { status, result, run, reset, abort, partialStdout, partialStderr, pid, processId, startedAt };
}
