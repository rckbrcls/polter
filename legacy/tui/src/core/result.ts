/**
 * Typed execution result — every execution returns one.
 *
 * Discriminated union on `ok`: callers can narrow with `if (result.ok)`.
 * Both branches carry the ExecutionContext and wall-clock duration.
 */

import type { ExecutionContext } from "./context.js";
import type { PolterError } from "./errors.js";

export type ExecutionResult<T = CommandOutput> =
  | { readonly ok: true;  readonly value: T;     readonly context: ExecutionContext; readonly durationMs: number }
  | { readonly ok: false; readonly error: PolterError; readonly context: ExecutionContext; readonly durationMs: number };

/** Standard output shape from a command execution. */
export interface CommandOutput {
  readonly exitCode: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly stdout: string;
  readonly stderr: string;
}

/** Create a successful result. */
export function success<T>(
  value: T,
  context: ExecutionContext,
  durationMs: number,
): ExecutionResult<T> {
  return { ok: true, value, context, durationMs };
}

/** Create a failed result. */
export function failure<T = never>(
  error: PolterError,
  context: ExecutionContext,
  durationMs: number,
): ExecutionResult<T> {
  return { ok: false, error, context, durationMs };
}
