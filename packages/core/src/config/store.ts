import { z } from "zod";
import { createHash } from "node:crypto";
import { basename, resolve } from "node:path";
import { getConf } from "./globalConf.js";
import type { Pipeline } from "../data/types.js";
import { PipelineSchema } from "../data/schemas.js";
import { existsSync } from "../lib/fs.js";

const GLOBAL_PIPELINES_KEY = "globalPipelinesV1";
const DESKTOP_REPOSITORIES_KEY = "desktopRepositoriesV1";

export interface DesktopRepository {
  id: string;
  name: string;
  path: string;
  lastOpenedAt: string;
  exists: boolean;
}

const DesktopRepositorySchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  lastOpenedAt: z.string(),
  exists: z.boolean(),
});

function normalizeRepositoryPath(repositoryPath: string): string {
  return resolve(repositoryPath).replace(/\/+$/, "");
}

function createRepositoryId(repositoryPath: string): string {
  const normalizedPath = normalizeRepositoryPath(repositoryPath);
  const name = basename(normalizedPath) || "repository";
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const hash = createHash("sha1").update(normalizedPath).digest("hex").slice(0, 10);
  return `${slug || "repository"}-${hash}`;
}

function hydrateRepository(
  repositoryPath: string,
  lastOpenedAt: string,
): DesktopRepository {
  const normalizedPath = normalizeRepositoryPath(repositoryPath);
  return {
    id: createRepositoryId(normalizedPath),
    name: basename(normalizedPath) || normalizedPath,
    path: normalizedPath,
    lastOpenedAt,
    exists: existsSync(normalizedPath),
  };
}

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

export function listDesktopRepositories(): DesktopRepository[] {
  const config = getConf();
  if (!config.has(DESKTOP_REPOSITORIES_KEY)) {
    config.set(DESKTOP_REPOSITORIES_KEY, []);
  }

  const raw = config.get(DESKTOP_REPOSITORIES_KEY);
  const result = z.array(DesktopRepositorySchema).safeParse(raw);
  if (!result.success) {
    return [];
  }

  const repositories = result.data.map((repository) => {
    const normalizedPath = normalizeRepositoryPath(repository.path);
    return {
      ...repository,
      path: normalizedPath,
      exists: existsSync(normalizedPath),
    };
  });

  config.set(DESKTOP_REPOSITORIES_KEY, repositories);
  return repositories.sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt));
}

export function addDesktopRepository(
  repositoryPath: string,
  lastOpenedAt: string = new Date().toISOString(),
): DesktopRepository {
  const repository = hydrateRepository(repositoryPath, lastOpenedAt);
  const repositories = listDesktopRepositories();
  const existingIndex = repositories.findIndex((item) => item.path === repository.path);

  if (existingIndex >= 0) {
    repositories[existingIndex] = {
      ...repositories[existingIndex]!,
      name: repository.name,
      lastOpenedAt,
      exists: repository.exists,
    };
  } else {
    repositories.unshift(repository);
  }

  getConf().set(DESKTOP_REPOSITORIES_KEY, repositories);
  return existingIndex >= 0 ? repositories[existingIndex]! : repository;
}

export function removeDesktopRepository(repositoryId: string): void {
  const repositories = listDesktopRepositories().filter(
    (repository) => repository.id !== repositoryId,
  );
  getConf().set(DESKTOP_REPOSITORIES_KEY, repositories);
}

export function __clearDesktopRepositoriesForTests(): void {
  getConf().set(DESKTOP_REPOSITORIES_KEY, []);
}
