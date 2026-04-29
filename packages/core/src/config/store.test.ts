import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __clearDesktopRepositoriesForTests,
  addDesktopRepository,
  listDesktopRepositories,
  removeDesktopRepository,
} from "./store.js";

const tempDirs: string[] = [];

function createTempRepo(name: string): string {
  const dir = mkdtempSync(join(tmpdir(), `polter-${name}-`));
  tempDirs.push(dir);
  return dir;
}

describe("desktop repositories", () => {
  beforeEach(() => {
    __clearDesktopRepositoriesForTests();
  });

  afterEach(() => {
    __clearDesktopRepositoriesForTests();
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("adds repositories with stable metadata", () => {
    const repoPath = createTempRepo("repo");
    const repository = addDesktopRepository(repoPath, "2026-04-23T12:00:00.000Z");

    expect(repository.path).toBe(repoPath);
    expect(repository.name).toMatch(/^polter-repo-/);
    expect(repository.exists).toBe(true);
    expect(listDesktopRepositories()).toEqual([repository]);
  });

  it("updates existing repositories instead of duplicating paths", () => {
    const repoPath = createTempRepo("repo");
    const first = addDesktopRepository(repoPath, "2026-04-23T12:00:00.000Z");
    const second = addDesktopRepository(`${repoPath}/`, "2026-04-23T13:00:00.000Z");

    expect(second.id).toBe(first.id);
    expect(second.lastOpenedAt).toBe("2026-04-23T13:00:00.000Z");
    expect(listDesktopRepositories()).toHaveLength(1);
  });

  it("removes repositories from the global list without touching files", () => {
    const repoPath = createTempRepo("repo");
    const repository = addDesktopRepository(repoPath);

    removeDesktopRepository(repository.id);

    expect(listDesktopRepositories()).toEqual([]);
    expect(existsSync(repoPath)).toBe(true);
  });

  it("refreshes missing repository status while listing", () => {
    const repoPath = createTempRepo("repo");
    const repository = addDesktopRepository(repoPath);
    rmSync(repoPath, { recursive: true, force: true });

    expect(listDesktopRepositories()).toEqual([
      {
        ...repository,
        exists: false,
      },
    ]);
  });
});
