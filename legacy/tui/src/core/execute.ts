/**
 * Central execution function — THE single code path for all command runs.
 *
 * Every execution in Polter (TUI, MCP, pipeline steps, process starts)
 * should flow through `execute()`. This gives every execution:
 * - An ExecutionContext (correlation, timing, tool identity)
 * - Structured error wrapping (PolterError with category)
 * - Event emission (execution:start, execution:end, execution:error)
 * - Timeout support (SIGTERM → SIGKILL escalation)
 *
 * In later phases, this function will also gain:
 * - Permission checks (Phase 2)
 * - Pre/post hooks (Phase 7)
 * - Span recording (Phase 6)
 */

import type { CliToolId, CommandDef } from "../data/types.js";
import { resolveToolCommand } from "../lib/toolResolver.js";
import { runCommand, type RunResult } from "../lib/runner.js";
import { createContext, type ExecutionContext } from "./context.js";
import {
  ToolNotFoundError,
  CommandFailedError,
  TimeoutError,
  SpawnError,
} from "./errors.js";
import { success, failure, type ExecutionResult, type CommandOutput } from "./result.js";
import { bus } from "./events.js";

export interface ExecuteOptions {
  /** Timeout in milliseconds. Overrides commandDef.timeoutMs. */
  timeoutMs?: number;
  /** Suppress stdout/stderr output. */
  quiet?: boolean;
  /** Callback for streaming output. */
  onData?: (stdout: string, stderr: string) => void;
  /** Parent execution context (for child executions like pipeline steps). */
  parent?: ExecutionContext;
}

/**
 * Execute a command through the unified pipeline.
 *
 * @param commandDef - The command definition from the registry
 * @param args - Additional arguments beyond commandDef.base
 * @param flags - CLI flags to append
 * @param cwd - Working directory
 * @param options - Timeout, quiet mode, parent context
 */
export async function execute(
  commandDef: CommandDef,
  args: string[] = [],
  flags: string[] = [],
  cwd: string = process.cwd(),
  options: ExecuteOptions = {},
): Promise<ExecutionResult> {
  const ctx = createContext({
    tool: commandDef.tool,
    commandId: commandDef.id,
    cwd,
    parent: options.parent,
  });

  const startTime = Date.now();

  // Emit start event
  bus.emit("execution:start", { context: ctx, args, flags });

  // Resolve the tool binary
  const resolution = resolveToolCommand(commandDef.tool, cwd);
  if (resolution.source === "not-found") {
    const error = new ToolNotFoundError(commandDef.tool, {
      commandId: commandDef.id,
      cwd,
    });
    const durationMs = Date.now() - startTime;
    bus.emit("execution:error", { context: ctx, error, durationMs });
    return failure(error, ctx, durationMs);
  }

  // Build the full args: base + user args + flags
  const fullArgs = [...commandDef.base, ...args, ...flags];

  // Determine timeout
  const timeoutMs = options.timeoutMs ?? commandDef.timeoutMs;

  try {
    const runResult = await executeWithTimeout(
      resolution,
      fullArgs,
      cwd,
      { quiet: options.quiet, onData: options.onData },
      timeoutMs,
      commandDef.id,
      ctx,
    );

    const durationMs = Date.now() - startTime;

    // Check for spawn errors
    if (runResult.spawnError) {
      const error = new SpawnError(
        resolution.command,
        runResult.spawnError,
        { commandId: commandDef.id, cwd },
      );
      bus.emit("execution:error", { context: ctx, error, durationMs });
      return failure(error, ctx, durationMs);
    }

    // Check for non-zero exit
    if (runResult.exitCode !== null && runResult.exitCode !== 0) {
      const error = new CommandFailedError(
        commandDef.id,
        runResult.exitCode,
        runResult.signal,
        runResult.stderr,
        { cwd },
      );
      bus.emit("execution:error", { context: ctx, error, durationMs });
      return failure(error, ctx, durationMs);
    }

    // Success
    const output: CommandOutput = {
      exitCode: runResult.exitCode,
      signal: runResult.signal,
      stdout: runResult.stdout,
      stderr: runResult.stderr,
    };

    bus.emit("execution:end", { context: ctx, output, durationMs });
    return success(output, ctx, durationMs);
  } catch (err) {
    const durationMs = Date.now() - startTime;

    // TimeoutError is thrown by executeWithTimeout
    if (err instanceof TimeoutError) {
      bus.emit("execution:error", { context: ctx, error: err, durationMs });
      return failure(err, ctx, durationMs);
    }

    // Unexpected error — wrap as SpawnError
    const error = new SpawnError(
      resolution.command,
      err instanceof Error ? err.message : String(err),
      { commandId: commandDef.id, cwd },
    );
    bus.emit("execution:error", { context: ctx, error, durationMs });
    return failure(error, ctx, durationMs);
  }
}

/**
 * Execute a raw command (not from a CommandDef) through the pipeline.
 * Used for ad-hoc commands like process starts.
 */
export async function executeRaw(
  tool: CliToolId,
  command: string,
  args: string[] = [],
  cwd: string = process.cwd(),
  options: ExecuteOptions = {},
): Promise<ExecutionResult> {
  const ctx = createContext({
    tool,
    cwd,
    parent: options.parent,
  });

  const startTime = Date.now();
  bus.emit("execution:start", { context: ctx, args, flags: [] });

  const timeoutMs = options.timeoutMs;

  try {
    const runResult = await executeWithTimeout(
      { command },
      args,
      cwd,
      { quiet: options.quiet, onData: options.onData },
      timeoutMs,
      command,
      ctx,
    );

    const durationMs = Date.now() - startTime;

    if (runResult.spawnError) {
      const error = new SpawnError(command, runResult.spawnError, { cwd });
      bus.emit("execution:error", { context: ctx, error, durationMs });
      return failure(error, ctx, durationMs);
    }

    if (runResult.exitCode !== null && runResult.exitCode !== 0) {
      const error = new CommandFailedError(
        command,
        runResult.exitCode,
        runResult.signal,
        runResult.stderr,
        { cwd },
      );
      bus.emit("execution:error", { context: ctx, error, durationMs });
      return failure(error, ctx, durationMs);
    }

    const output: CommandOutput = {
      exitCode: runResult.exitCode,
      signal: runResult.signal,
      stdout: runResult.stdout,
      stderr: runResult.stderr,
    };

    bus.emit("execution:end", { context: ctx, output, durationMs });
    return success(output, ctx, durationMs);
  } catch (err) {
    const durationMs = Date.now() - startTime;

    if (err instanceof TimeoutError) {
      bus.emit("execution:error", { context: ctx, error: err, durationMs });
      return failure(err, ctx, durationMs);
    }

    const error = new SpawnError(
      command,
      err instanceof Error ? err.message : String(err),
      { cwd },
    );
    bus.emit("execution:error", { context: ctx, error, durationMs });
    return failure(error, ctx, durationMs);
  }
}

// --- Internal ---

async function executeWithTimeout(
  execution: { command: string; env?: NodeJS.ProcessEnv },
  args: string[],
  cwd: string,
  options: { quiet?: boolean; onData?: (stdout: string, stderr: string) => void },
  timeoutMs: number | undefined,
  commandId: string,
  ctx: ExecutionContext,
): Promise<RunResult> {
  const handle = runCommand(execution, args, cwd, options);

  if (!timeoutMs) {
    return handle.promise;
  }

  return new Promise<RunResult>((resolve, reject) => {
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      // Graceful shutdown: SIGTERM first
      handle.abort();

      // Escalate to SIGKILL after 3 seconds
      const killTimer = setTimeout(() => {
        if (handle.pid) {
          try { process.kill(-handle.pid, "SIGKILL"); } catch { /* already gone */ }
        }
      }, 3000);

      // Still resolve the promise so we capture partial output
      handle.promise.then((result) => {
        clearTimeout(killTimer);
        reject(
          new TimeoutError(commandId, timeoutMs, {
            partialStdout: result.stdout.slice(0, 2000),
            partialStderr: result.stderr.slice(0, 2000),
            correlationId: ctx.correlationId,
          }),
        );
      });
    }, timeoutMs);

    handle.promise.then(
      (result) => {
        if (!timedOut) {
          clearTimeout(timer);
          resolve(result);
        }
      },
      (err) => {
        if (!timedOut) {
          clearTimeout(timer);
          reject(err);
        }
      },
    );
  });
}
