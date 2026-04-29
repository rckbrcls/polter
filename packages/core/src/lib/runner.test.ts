import { afterEach, describe, expect, it } from "vitest";
import { delimiter, join } from "node:path";
import { tmpdir } from "node:os";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import {
  findLocalSupabaseBinDir,
  resolveSupabaseCommand,
  runCommand,
  runInteractiveCommand,
} from "./runner.js";

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "polter-runner-"));
  tempDirs.push(dir);
  return dir;
}

function createLocalSupabaseInstall(rootDir: string): string {
  const binDir = join(rootDir, "node_modules", ".bin");
  const binaryName = process.platform === "win32" ? "supabase.cmd" : "supabase";

  mkdirSync(binDir, { recursive: true });
  writeFileSync(join(binDir, binaryName), "");

  return binDir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("findLocalSupabaseBinDir", () => {
  it("finds the nearest repository-local supabase binary", () => {
    const rootDir = createTempDir();
    const binDir = createLocalSupabaseInstall(rootDir);
    const nestedDir = join(rootDir, "apps", "web");

    mkdirSync(nestedDir, { recursive: true });

    expect(findLocalSupabaseBinDir(nestedDir)).toBe(binDir);
  });

  it("returns undefined when no repository-local supabase binary exists", () => {
    const rootDir = createTempDir();
    const nestedDir = join(rootDir, "apps", "web");

    mkdirSync(nestedDir, { recursive: true });

    expect(findLocalSupabaseBinDir(nestedDir)).toBeUndefined();
  });
});

describe("resolveSupabaseCommand", () => {
  it("prepends the repository-local bin directory to PATH", () => {
    const rootDir = createTempDir();
    const binDir = createLocalSupabaseInstall(rootDir);
    const nestedDir = join(rootDir, "packages", "cli");
    const env = { PATH: "/usr/bin" };

    mkdirSync(nestedDir, { recursive: true });

    const resolution = resolveSupabaseCommand(nestedDir, env);

    expect(resolution.source).toBe("repository");
    expect(resolution.localBinDir).toBe(binDir);
    expect(resolution.env?.PATH).toBe(`${binDir}${delimiter}/usr/bin`);
    expect(env.PATH).toBe("/usr/bin");
  });

  it("falls back to PATH when no repository-local binary exists", () => {
    const rootDir = createTempDir();
    const nestedDir = join(rootDir, "packages", "cli");
    const env = { PATH: "/usr/bin" };

    mkdirSync(nestedDir, { recursive: true });

    const resolution = resolveSupabaseCommand(nestedDir, env);

    expect(resolution.source).toBe("path");
    expect(resolution.localBinDir).toBeUndefined();
    expect(resolution.env?.PATH).toBe("/usr/bin");
  });
});

describe("runInteractiveCommand", () => {
  it("runs synchronously and returns exit code", () => {
    const result = runInteractiveCommand("echo", ["hello"], "/tmp");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("");
  });

  it("returns non-zero for failing commands", () => {
    const result = runInteractiveCommand("false", [], "/tmp");
    expect(result.exitCode).not.toBe(0);
  });
});

describe("runCommand", () => {
  it("captures stdout in quiet mode without inheriting stdin", async () => {
    const result = await runCommand("echo", ["hello"], "/tmp", { quiet: true }).promise;

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("hello");
  });

  it("returns non-zero exit code for failing commands in quiet mode", async () => {
    const result = await runCommand("false", [], "/tmp", { quiet: true }).promise;

    expect(result.exitCode).not.toBe(0);
  });

  it("does not hang on commands that would read stdin in quiet mode", async () => {
    const result = await runCommand("cat", [], "/tmp", { quiet: true }).promise;

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("");
  });
});
