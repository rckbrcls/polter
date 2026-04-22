/**
 * Execution context — every command execution carries one.
 *
 * Contexts form a tree: a pipeline run creates a root context, and each
 * step creates a child context that inherits the `correlationId` from the
 * parent. This enables cross-step log correlation and span parenting.
 */

import { randomUUID } from "node:crypto";
import type { CliToolId } from "../data/types.js";

export interface ExecutionContext {
  /** Unique ID for this specific execution. */
  readonly id: string;

  /**
   * Shared correlation ID. Child contexts inherit this from their parent
   * so that all steps within a pipeline run share the same correlation.
   */
  readonly correlationId: string;

  /** Which CLI tool is being invoked. */
  readonly tool: CliToolId;

  /** The CommandDef.id being executed, when applicable. */
  readonly commandId?: string;

  /** Working directory for the execution. */
  readonly cwd: string;

  /** When the execution started. */
  readonly startedAt: Date;

  /** Parent context ID, if this is a child (e.g. pipeline step). */
  readonly parentId?: string;
}

export interface CreateContextOptions {
  tool: CliToolId;
  cwd: string;
  commandId?: string;
  /** Supply a parent to create a child context that shares correlationId. */
  parent?: ExecutionContext;
}

/**
 * Create a new execution context. If `parent` is provided, the child
 * inherits the parent's `correlationId`.
 */
export function createContext(opts: CreateContextOptions): ExecutionContext {
  const id = randomUUID();

  return {
    id,
    correlationId: opts.parent?.correlationId ?? id,
    tool: opts.tool,
    commandId: opts.commandId,
    cwd: opts.cwd,
    startedAt: new Date(),
    parentId: opts.parent?.id,
  };
}
