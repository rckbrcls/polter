/**
 * Unified typed event bus for Polter.
 *
 * Replaces the scattered `processEvents` and `pipelineEvents` singletons
 * with a single bus. All events carry an ExecutionContext (or relevant
 * subset) so consumers can correlate across subsystems.
 */

import EE from "eventemitter3";
import type { ExecutionContext } from "./context.js";
import type { PolterError } from "./errors.js";
import type { CommandOutput } from "./result.js";

// --- Event payload types ---

export interface ExecutionStartEvent {
  readonly context: ExecutionContext;
  readonly args: string[];
  readonly flags: string[];
}

export interface ExecutionEndEvent {
  readonly context: ExecutionContext;
  readonly output: CommandOutput;
  readonly durationMs: number;
}

export interface ExecutionErrorEvent {
  readonly context: ExecutionContext;
  readonly error: PolterError;
  readonly durationMs: number;
}

export interface ExecutionRetryEvent {
  readonly context: ExecutionContext;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly error: PolterError;
  readonly backoffMs: number;
}

export interface ProcessEvent {
  readonly processId: string;
  readonly correlationId?: string;
}

export interface ProcessOutputEvent extends ProcessEvent {
  readonly stream: "stdout" | "stderr";
  readonly data: string;
}

export interface ProcessCrashEvent extends ProcessEvent {
  readonly exitCode: number | null;
  readonly signal: string | null;
  readonly restartCount: number;
}

export interface PipelineStepEvent {
  readonly pipelineId: string;
  readonly runId: string;
  readonly stepIndex: number;
  readonly stepLabel: string;
  readonly correlationId: string;
}

export interface PipelineEndEvent {
  readonly pipelineId: string;
  readonly runId: string;
  readonly correlationId: string;
  readonly status: "completed" | "failed";
  readonly durationMs: number;
}

// --- Event map ---

interface PolterEventMap {
  "execution:start": (event: ExecutionStartEvent) => void;
  "execution:end": (event: ExecutionEndEvent) => void;
  "execution:error": (event: ExecutionErrorEvent) => void;
  "execution:retry": (event: ExecutionRetryEvent) => void;

  "process:start": (event: ProcessEvent) => void;
  "process:stop": (event: ProcessEvent) => void;
  "process:crash": (event: ProcessCrashEvent) => void;
  "process:output": (event: ProcessOutputEvent) => void;

  "pipeline:step:start": (event: PipelineStepEvent) => void;
  "pipeline:step:end": (event: PipelineStepEvent & { durationMs: number; ok: boolean }) => void;
  "pipeline:end": (event: PipelineEndEvent) => void;
}

// --- Bus singleton ---

const EventEmitter = EE.EventEmitter ?? EE;

class PolterEventBus extends EventEmitter<PolterEventMap> {}

/** Global event bus — import and use directly. */
export const bus = new PolterEventBus();

/**
 * Reset the bus for testing — removes all listeners.
 * @internal
 */
export function _resetBusForTests(): void {
  bus.removeAllListeners();
}
