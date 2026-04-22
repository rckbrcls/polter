import type { Pipeline } from "../data/types.js";
import { getProjectPipelines, saveProjectPipeline, deleteProjectPipeline } from "../config/projectConfig.js";
import { getGlobalPipelines, saveGlobalPipeline, deleteGlobalPipeline } from "../config/store.js";

export type PipelineSource = "project" | "global";

export interface PipelineWithSource extends Pipeline {
  source: PipelineSource;
}

export function getAllPipelines(startDir?: string): PipelineWithSource[] {
  const projectPipelines = getProjectPipelines(startDir).map((p) => ({
    ...p,
    source: "project" as PipelineSource,
  }));
  const globalPipelines = getGlobalPipelines().map((p) => ({
    ...p,
    source: "global" as PipelineSource,
  }));

  // Project pipelines take precedence over global with same id
  const seen = new Set(projectPipelines.map((p) => p.id));
  const merged = [
    ...projectPipelines,
    ...globalPipelines.filter((p) => !seen.has(p.id)),
  ];

  return merged;
}

export function savePipeline(
  pipeline: Pipeline,
  source: PipelineSource,
  startDir?: string,
): boolean {
  if (source === "project") {
    return saveProjectPipeline(pipeline, startDir);
  } else {
    saveGlobalPipeline(pipeline);
    return true;
  }
}

export function deletePipeline(
  pipelineId: string,
  source: PipelineSource,
  startDir?: string,
): void {
  if (source === "project") {
    deleteProjectPipeline(pipelineId, startDir);
  } else {
    deleteGlobalPipeline(pipelineId);
  }
}

export function findPipelineByName(
  name: string,
  startDir?: string,
): PipelineWithSource | undefined {
  return getAllPipelines(startDir).find((p) => p.name === name);
}
