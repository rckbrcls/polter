import { existsSync, readFileSync, writeFileSync, mkdirSync } from "../lib/fs.js";
import { join } from "node:path";
import { findNearestPackageRoot } from "../lib/packageRoot.js";
import type { ProjectConfig, Pipeline } from "../data/types.js";

const CONFIG_DIR = ".polter";
const CONFIG_FILE = "config.json";

function defaultConfig(): ProjectConfig {
  return {
    version: 1,
    tools: {},
    pipelines: [],
  };
}

export function getProjectConfigPath(
  startDir?: string,
): { dir: string; file: string } | undefined {
  const root = findNearestPackageRoot(startDir);
  if (!root) return undefined;
  const dir = join(root, CONFIG_DIR);
  return { dir, file: join(dir, CONFIG_FILE) };
}

export function readProjectConfig(startDir?: string): ProjectConfig | undefined {
  const paths = getProjectConfigPath(startDir);
  if (!paths) return undefined;

  if (!existsSync(paths.file)) return undefined;

  try {
    const raw = readFileSync(paths.file, "utf-8");
    return JSON.parse(raw) as ProjectConfig;
  } catch {
    return undefined;
  }
}

export function writeProjectConfig(
  config: ProjectConfig,
  startDir?: string,
): boolean {
  const paths = getProjectConfigPath(startDir);
  if (!paths) return false;

  mkdirSync(paths.dir, { recursive: true });
  writeFileSync(paths.file, JSON.stringify(config, null, 2) + "\n", "utf-8");
  return true;
}

export function getOrCreateProjectConfig(startDir?: string): ProjectConfig {
  return readProjectConfig(startDir) ?? defaultConfig();
}

export function getProjectPipelines(startDir?: string): Pipeline[] {
  const config = readProjectConfig(startDir);
  return config?.pipelines ?? [];
}

export function saveProjectPipeline(
  pipeline: Pipeline,
  startDir?: string,
): boolean {
  const config = getOrCreateProjectConfig(startDir);
  const idx = config.pipelines.findIndex((p) => p.id === pipeline.id);
  if (idx >= 0) {
    config.pipelines[idx] = pipeline;
  } else {
    config.pipelines.push(pipeline);
  }
  return writeProjectConfig(config, startDir);
}

export function deleteProjectPipeline(
  pipelineId: string,
  startDir?: string,
): boolean {
  const config = getOrCreateProjectConfig(startDir);
  config.pipelines = config.pipelines.filter((p) => p.id !== pipelineId);
  return writeProjectConfig(config, startDir);
}
