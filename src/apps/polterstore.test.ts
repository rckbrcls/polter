import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { polterstoreProfile } from "./polterstore.js";

const tempDirs: string[] = [];

function createPolterstoreFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "polterbase-polterstore-test-"));
  tempDirs.push(root);

  mkdirSync(join(root, "src-tauri"), { recursive: true });
  mkdirSync(join(root, "supabase", "migrations"), { recursive: true });
  writeFileSync(join(root, "src-tauri", "tauri.conf.json"), "{}\n");
  writeFileSync(join(root, "package.json"), '{ "name": "polterstore-desktop" }\n');

  return root;
}

describe("polterstoreProfile", () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it("detects the project root directly", () => {
    const root = createPolterstoreFixture();
    expect(polterstoreProfile.detect(root)).toBe(root);
  });

  it("resolves a sibling polterstore folder from a parent directory", () => {
    const marketRoot = mkdtempSync(join(tmpdir(), "polterbase-market-test-"));
    tempDirs.push(marketRoot);

    const polterstoreRoot = join(marketRoot, "polterstore");
    mkdirSync(join(polterstoreRoot, "src-tauri"), { recursive: true });
    mkdirSync(join(polterstoreRoot, "supabase", "migrations"), { recursive: true });
    writeFileSync(join(polterstoreRoot, "src-tauri", "tauri.conf.json"), "{}\n");
    writeFileSync(join(polterstoreRoot, "package.json"), '{ "name": "polterstore-desktop" }\n');

    expect(polterstoreProfile.resolveProjectRoot(marketRoot)).toBe(polterstoreRoot);
  });
});
