import { afterEach, describe, expect, it } from "vitest";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { findNearestPackageRoot } from "./packageRoot.js";

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "polter-package-root-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("findNearestPackageRoot", () => {
  it("finds the nearest parent directory that contains package.json", () => {
    const rootDir = createTempDir();
    const nestedDir = join(rootDir, "apps", "web");

    mkdirSync(nestedDir, { recursive: true });
    writeFileSync(join(rootDir, "package.json"), "{}");

    expect(findNearestPackageRoot(nestedDir)).toBe(rootDir);
  });

  it("returns undefined when no package.json exists in parent directories", () => {
    const rootDir = createTempDir();
    const nestedDir = join(rootDir, "apps", "web");

    mkdirSync(nestedDir, { recursive: true });

    expect(findNearestPackageRoot(nestedDir)).toBeUndefined();
  });
});
