import pLimit from "p-limit";
import type { PlanAction } from "./schema.js";
import { runCommand } from "../lib/runner.js";
import { resolveToolCommand } from "../lib/toolResolver.js";
import type { RunResult } from "../lib/runner.js";

export interface ApplyResult {
  action: PlanAction;
  success: boolean;
  result: RunResult;
}

export async function applyActions(
  actions: PlanAction[],
  cwd: string = process.cwd(),
  onProgress?: (completed: number, total: number, current: PlanAction) => void,
  onOutput?: (actionIndex: number, stdout: string, stderr: string) => void,
): Promise<ApplyResult[]> {
  const limit = pLimit(3);
  let completed = 0;

  const results = await Promise.all(
    actions.map((action, actionIndex) =>
      limit(async (): Promise<ApplyResult> => {
        onProgress?.(completed, actions.length, action);

        const onData = onOutput
          ? (stdout: string, stderr: string) => onOutput(actionIndex, stdout, stderr)
          : undefined;

        const resolved = resolveToolCommand(action.tool, cwd);
        const result = await runCommand(
          { command: resolved.command, env: resolved.env },
          action.args,
          cwd,
          { onData },
        ).promise;

        completed++;
        const success = !result.spawnError && result.exitCode === 0;
        return { action, success, result };
      }),
    ),
  );

  return results;
}
