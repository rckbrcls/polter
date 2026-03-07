import type { Pipeline, PipelineStep } from "../data/types.js";
import { runCommand, type RunResult } from "../lib/runner.js";
import { resolveToolCommand } from "../lib/toolResolver.js";
import { getCommandById } from "../data/commands/index.js";
import { resolvePkgArgs } from "../lib/pkgManager.js";

export type StepStatus = "pending" | "running" | "success" | "error" | "skipped";

export interface StepResult {
  step: PipelineStep;
  status: StepStatus;
  result?: RunResult;
}

export interface PipelineProgress {
  stepResults: StepResult[];
  currentStepIndex: number;
  done: boolean;
}

export type ProgressCallback = (progress: PipelineProgress) => void;

export async function executePipeline(
  pipeline: Pipeline,
  onProgress: ProgressCallback,
  cwd: string = process.cwd(),
): Promise<StepResult[]> {
  const stepResults: StepResult[] = pipeline.steps.map((step) => ({
    step,
    status: "pending" as StepStatus,
  }));

  let aborted = false;

  for (let i = 0; i < pipeline.steps.length; i++) {
    const step = pipeline.steps[i]!;

    if (aborted) {
      stepResults[i] = { step, status: "skipped" };
      onProgress({ stepResults: [...stepResults], currentStepIndex: i, done: false });
      continue;
    }

    stepResults[i] = { step, status: "running" };
    onProgress({ stepResults: [...stepResults], currentStepIndex: i, done: false });

    const cmdDef = getCommandById(step.commandId);
    const toolId = cmdDef?.tool ?? "supabase";
    const resolved = resolveToolCommand(toolId, cwd);
    let baseArgs = cmdDef?.base ?? [];
    if (toolId === "pkg" && cmdDef) {
      try {
        const translated = resolvePkgArgs(cmdDef.base, cwd);
        baseArgs = translated.args;
      } catch { /* unsupported command — will fail at execution */ }
    }
    const allArgs = [...baseArgs, ...step.args, ...step.flags];

    const result = await runCommand(
      { command: resolved.command, env: resolved.env },
      allArgs,
      cwd,
    ).promise;

    const success = !result.spawnError && result.exitCode === 0;
    stepResults[i] = {
      step,
      status: success ? "success" : "error",
      result,
    };

    if (!success && !step.continueOnError) {
      aborted = true;
    }

    onProgress({ stepResults: [...stepResults], currentStepIndex: i, done: false });
  }

  onProgress({
    stepResults: [...stepResults],
    currentStepIndex: pipeline.steps.length - 1,
    done: true,
  });

  return stepResults;
}
