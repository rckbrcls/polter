/**
 * Unified configuration layer.
 *
 * Merges three sources into a single validated view:
 * 1. Project config  (.polter/config.json)
 * 2. Global config   (~/.polter/ via conf package)
 * 3. Environment variables (POLTER_*)
 *
 * Consumers call `getConfig()` with a cwd, and get a merged, validated
 * object back. The merge is shallow — project values override global ones.
 */

import { z } from "zod";
import { readProjectConfig } from "../config/projectConfig.js";
import { getConf } from "../config/globalConf.js";
import type { ProjectConfig, Pipeline } from "../data/types.js";
import { PipelineSchema } from "../data/schemas.js";

// --- Schema for merged runtime config ---

const GLOBAL_PIPELINES_KEY = "globalPipelinesV1";

export interface PolterConfig {
  /** Project config values, if available. */
  project: ProjectConfig | undefined;
  /** Merged pipelines: project overrides global by ID. */
  pipelines: Pipeline[];
  /** Resolved settings from env vars. */
  env: {
    logFormat: "text" | "json";
    logLevel: "debug" | "info" | "warn" | "error";
    debug: boolean;
  };
}

/**
 * Build a merged config for the given working directory.
 * Cheap to call — no disk caching needed since readProjectConfig already
 * does a single readFileSync.
 */
export function getConfig(cwd?: string): PolterConfig {
  const project = readProjectConfig(cwd);
  const globalPipelines = loadGlobalPipelines();
  const projectPipelines = project?.pipelines ?? [];

  // Project pipelines override global ones with the same ID
  const globalMap = new Map(globalPipelines.map((p) => [p.id, p]));
  for (const pp of projectPipelines) {
    globalMap.set(pp.id, pp);
  }

  return {
    project,
    pipelines: Array.from(globalMap.values()),
    env: {
      logFormat: process.env.POLTER_LOG_FORMAT === "json" ? "json" : "text",
      logLevel: parseLogLevel(process.env.POLTER_LOG_LEVEL),
      debug: process.env.POLTER_DEBUG === "1" || process.env.POLTER_DEBUG === "true",
    },
  };
}

// --- Helpers ---

function loadGlobalPipelines(): Pipeline[] {
  const conf = getConf();
  if (!conf.has(GLOBAL_PIPELINES_KEY)) return [];
  const raw = conf.get(GLOBAL_PIPELINES_KEY);
  const result = z.array(PipelineSchema).safeParse(raw);
  return result.success ? result.data : [];
}

function parseLogLevel(
  value: string | undefined,
): "debug" | "info" | "warn" | "error" {
  if (value === "debug" || value === "info" || value === "warn" || value === "error") {
    return value;
  }
  return "info";
}
