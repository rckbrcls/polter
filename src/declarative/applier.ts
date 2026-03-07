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
): Promise<ApplyResult[]> {
  const results: ApplyResult[] = [];

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i]!;
    onProgress?.(i, actions.length, action);

    const resolved = resolveToolCommand(action.tool, cwd);
    const result = await runCommand(
      { command: resolved.command, env: resolved.env },
      action.args,
      cwd,
    ).promise;

    const success = !result.spawnError && result.exitCode === 0;
    results.push({ action, success, result });
  }

  return results;
}
