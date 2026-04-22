import { afterEach, describe, expect, it } from "vitest";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import {
  detectPkgManager,
  translateCommand,
  resolvePkgArgs,
  UnsupportedCommandError,
} from "./pkgManager.js";

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "polter-pkg-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tempDirs.length = 0;
});

describe("detectPkgManager", () => {
  it("detects npm by package-lock.json", () => {
    const dir = createTempDir();
    writeFileSync(join(dir, "package-lock.json"), "{}");
    const result = detectPkgManager(dir);
    expect(result.id).toBe("npm");
    expect(result.command).toBe("npm");
  });

  it("detects pnpm by pnpm-lock.yaml", () => {
    const dir = createTempDir();
    writeFileSync(join(dir, "pnpm-lock.yaml"), "");
    const result = detectPkgManager(dir);
    expect(result.id).toBe("pnpm");
    expect(result.command).toBe("pnpm");
  });

  it("detects yarn by yarn.lock", () => {
    const dir = createTempDir();
    writeFileSync(join(dir, "yarn.lock"), "");
    const result = detectPkgManager(dir);
    expect(result.id).toBe("yarn");
    expect(result.command).toBe("yarn");
  });

  it("detects bun by bun.lockb", () => {
    const dir = createTempDir();
    writeFileSync(join(dir, "bun.lockb"), "");
    const result = detectPkgManager(dir);
    expect(result.id).toBe("bun");
    expect(result.command).toBe("bun");
  });

  it("detects bun by bun.lock", () => {
    const dir = createTempDir();
    writeFileSync(join(dir, "bun.lock"), "");
    const result = detectPkgManager(dir);
    expect(result.id).toBe("bun");
    expect(result.command).toBe("bun");
  });

  it("falls back to npm when no lock file found", () => {
    const dir = createTempDir();
    const result = detectPkgManager(dir);
    expect(result.id).toBe("npm");
  });

  it("bun takes priority over pnpm when both exist", () => {
    const dir = createTempDir();
    writeFileSync(join(dir, "bun.lockb"), "");
    writeFileSync(join(dir, "pnpm-lock.yaml"), "");
    const result = detectPkgManager(dir);
    expect(result.id).toBe("bun");
  });
});

describe("translateCommand", () => {
  it("translates install for all managers", () => {
    expect(translateCommand(["install"], "npm")).toEqual({ command: "npm", args: ["install"] });
    expect(translateCommand(["install"], "pnpm")).toEqual({ command: "pnpm", args: ["install"] });
    expect(translateCommand(["install"], "yarn")).toEqual({ command: "yarn", args: ["install"] });
    expect(translateCommand(["install"], "bun")).toEqual({ command: "bun", args: ["install"] });
  });

  it("translates add → npm install", () => {
    expect(translateCommand(["add", "react"], "npm")).toEqual({ command: "npm", args: ["install", "react"] });
  });

  it("keeps add for pnpm/yarn/bun", () => {
    expect(translateCommand(["add", "react"], "pnpm")).toEqual({ command: "pnpm", args: ["add", "react"] });
    expect(translateCommand(["add", "react"], "yarn")).toEqual({ command: "yarn", args: ["add", "react"] });
    expect(translateCommand(["add", "react"], "bun")).toEqual({ command: "bun", args: ["add", "react"] });
  });

  it("translates remove → npm uninstall", () => {
    expect(translateCommand(["remove", "lodash"], "npm")).toEqual({ command: "npm", args: ["uninstall", "lodash"] });
  });

  it("translates ls → yarn list", () => {
    expect(translateCommand(["ls"], "yarn")).toEqual({ command: "yarn", args: ["list"] });
  });

  it("throws for unsupported commands on bun", () => {
    expect(() => translateCommand(["publish"], "bun")).toThrow(UnsupportedCommandError);
    expect(() => translateCommand(["audit"], "bun")).toThrow(UnsupportedCommandError);
    expect(() => translateCommand(["outdated"], "bun")).toThrow(UnsupportedCommandError);
    expect(() => translateCommand(["ls"], "bun")).toThrow(UnsupportedCommandError);
  });

  it("translates run for all managers", () => {
    expect(translateCommand(["run", "build"], "npm")).toEqual({ command: "npm", args: ["run", "build"] });
    expect(translateCommand(["run", "build"], "pnpm")).toEqual({ command: "pnpm", args: ["run", "build"] });
    expect(translateCommand(["run", "build"], "bun")).toEqual({ command: "bun", args: ["run", "build"] });
  });

  it("handles empty base", () => {
    expect(translateCommand([], "npm")).toEqual({ command: "npm", args: [] });
  });
});

describe("resolvePkgArgs", () => {
  it("resolves using detected manager", () => {
    const dir = createTempDir();
    writeFileSync(join(dir, "pnpm-lock.yaml"), "");
    const result = resolvePkgArgs(["add", "react"], dir);
    expect(result.command).toBe("pnpm");
    expect(result.args).toEqual(["add", "react"]);
  });
});
