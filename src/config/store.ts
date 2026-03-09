import { z } from "zod";
import { getConf } from "./globalConf.js";
import type { Pipeline } from "../data/types.js";
import { PipelineSchema } from "../data/schemas.js";

const GLOBAL_PIPELINES_KEY = "globalPipelinesV1";

export function getGlobalPipelines(): Pipeline[] {
  const config = getConf();
  if (!config.has(GLOBAL_PIPELINES_KEY)) {
    config.set(GLOBAL_PIPELINES_KEY, []);
  }
  const raw = config.get(GLOBAL_PIPELINES_KEY);
  const result = z.array(PipelineSchema).safeParse(raw);
  return result.success ? result.data : [];
}

export function saveGlobalPipeline(pipeline: Pipeline): void {
  const config = getConf();
  const pipelines = getGlobalPipelines();
  const idx = pipelines.findIndex((p) => p.id === pipeline.id);
  if (idx >= 0) {
    pipelines[idx] = pipeline;
  } else {
    pipelines.push(pipeline);
  }
  config.set(GLOBAL_PIPELINES_KEY, pipelines);
}

export function deleteGlobalPipeline(pipelineId: string): void {
  const config = getConf();
  const pipelines = getGlobalPipelines().filter((p) => p.id !== pipelineId);
  config.set(GLOBAL_PIPELINES_KEY, pipelines);
}

export function __clearGlobalPipelinesForTests(): void {
  getConf().set(GLOBAL_PIPELINES_KEY, []);
}
