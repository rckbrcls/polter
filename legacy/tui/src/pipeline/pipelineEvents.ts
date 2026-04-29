import EE from "eventemitter3";
import type { PipelineStep } from "../data/types.js";
import type { StepResult } from "./engine.js";

interface PipelineEvents {
  stepStarted: (step: PipelineStep, index: number) => void;
  stepCompleted: (result: StepResult, index: number) => void;
  pipelineCompleted: (results: StepResult[]) => void;
}

const EventEmitter = EE.EventEmitter ?? EE;
export const pipelineEvents = new EventEmitter<PipelineEvents>();
