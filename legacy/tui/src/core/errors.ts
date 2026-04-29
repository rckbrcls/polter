/**
 * Polter error taxonomy.
 *
 * Every error carries a machine-readable `code`, a `category` that drives
 * automatic behavior (retry, abort, prompt), and a free-form `context` bag
 * for structured diagnostics.
 */

export type ErrorCategory = "retryable" | "permanent" | "timeout" | "permission";

export const ErrorCode = {
  TOOL_NOT_FOUND: "TOOL_NOT_FOUND",
  COMMAND_FAILED: "COMMAND_FAILED",
  TIMEOUT: "TIMEOUT",
  SPAWN_ERROR: "SPAWN_ERROR",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  PIPELINE_STEP_FAILED: "PIPELINE_STEP_FAILED",
  PROCESS_CRASH: "PROCESS_CRASH",
  CONFIG_INVALID: "CONFIG_INVALID",
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export class PolterError extends Error {
  readonly code: ErrorCodeValue;
  readonly category: ErrorCategory;
  readonly context: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCodeValue,
    category: ErrorCategory,
    context: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "PolterError";
    this.code = code;
    this.category = category;
    this.context = context;
  }

  get isRetryable(): boolean {
    return this.category === "retryable";
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      context: this.context,
    };
  }
}

/**
 * A required CLI tool (supabase, gh, vercel, git) was not found on PATH
 * or in local node_modules/.bin.
 */
export class ToolNotFoundError extends PolterError {
  constructor(tool: string, context: Record<string, unknown> = {}) {
    super(
      `Tool "${tool}" not found. Ensure it is installed and on your PATH.`,
      ErrorCode.TOOL_NOT_FOUND,
      "permanent",
      { tool, ...context },
    );
    this.name = "ToolNotFoundError";
  }
}

/**
 * A command exited with a non-zero code. Category is inferred from the
 * exit code: codes commonly associated with transient failures (e.g. 137
 * SIGKILL, 143 SIGTERM) are retryable; everything else is permanent.
 */
export class CommandFailedError extends PolterError {
  readonly exitCode: number | null;
  readonly signal: string | null;

  constructor(
    commandId: string,
    exitCode: number | null,
    signal: string | null,
    stderr: string,
    context: Record<string, unknown> = {},
  ) {
    const category: ErrorCategory = isTransientExitCode(exitCode)
      ? "retryable"
      : "permanent";

    super(
      `Command "${commandId}" failed (exit ${exitCode ?? "unknown"}, signal ${signal ?? "none"})`,
      ErrorCode.COMMAND_FAILED,
      category,
      { commandId, exitCode, signal, stderr: stderr.slice(0, 2000), ...context },
    );
    this.name = "CommandFailedError";
    this.exitCode = exitCode;
    this.signal = signal;
  }
}

/**
 * A command exceeded its configured timeout.
 * Always retryable — the command may succeed with more time or on retry.
 */
export class TimeoutError extends PolterError {
  constructor(
    commandId: string,
    timeoutMs: number,
    context: Record<string, unknown> = {},
  ) {
    super(
      `Command "${commandId}" timed out after ${timeoutMs}ms`,
      ErrorCode.TIMEOUT,
      "retryable",
      { commandId, timeoutMs, ...context },
    );
    this.name = "TimeoutError";
  }
}

/**
 * Failed to spawn the subprocess (e.g. ENOENT, EACCES).
 * Permanent — the binary is missing or inaccessible.
 */
export class SpawnError extends PolterError {
  constructor(
    command: string,
    originalMessage: string,
    context: Record<string, unknown> = {},
  ) {
    const category: ErrorCategory = originalMessage.includes("ENOENT")
      ? "permanent"
      : "retryable";

    super(
      `Failed to spawn "${command}": ${originalMessage}`,
      ErrorCode.SPAWN_ERROR,
      category,
      { command, originalMessage, ...context },
    );
    this.name = "SpawnError";
  }
}

/**
 * The execution was blocked by the permission system.
 */
export class PermissionDeniedError extends PolterError {
  constructor(
    commandId: string,
    reason: string,
    context: Record<string, unknown> = {},
  ) {
    super(
      `Permission denied for "${commandId}": ${reason}`,
      ErrorCode.PERMISSION_DENIED,
      "permission",
      { commandId, reason, ...context },
    );
    this.name = "PermissionDeniedError";
  }
}

/**
 * A pipeline step failed. Wraps the underlying error with step context.
 */
export class PipelineStepFailedError extends PolterError {
  readonly cause: PolterError | Error;

  constructor(
    pipelineId: string,
    stepIndex: number,
    stepLabel: string,
    cause: PolterError | Error,
    context: Record<string, unknown> = {},
  ) {
    const category: ErrorCategory =
      cause instanceof PolterError ? cause.category : "permanent";

    super(
      `Pipeline "${pipelineId}" step ${stepIndex} ("${stepLabel}") failed: ${cause.message}`,
      ErrorCode.PIPELINE_STEP_FAILED,
      category,
      { pipelineId, stepIndex, stepLabel, ...context },
    );
    this.name = "PipelineStepFailedError";
    this.cause = cause;
  }
}

// --- Helpers ---

/** Exit codes commonly associated with signals / transient failures. */
function isTransientExitCode(code: number | null): boolean {
  if (code === null) return true; // killed before exit — usually transient
  // 137 = SIGKILL, 143 = SIGTERM, 130 = SIGINT
  return code === 137 || code === 143 || code === 130;
}
