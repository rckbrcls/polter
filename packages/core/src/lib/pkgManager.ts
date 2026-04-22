import { existsSync } from "./fs.js";
import { join, dirname } from "node:path";

export type PkgManagerId = "npm" | "pnpm" | "yarn" | "bun";

export interface PkgManagerInfo {
  id: PkgManagerId;
  lockFile: string;
  command: string;
}

const LOCK_FILES: Array<{ file: string; id: PkgManagerId }> = [
  { file: "bun.lockb", id: "bun" },
  { file: "bun.lock", id: "bun" },
  { file: "pnpm-lock.yaml", id: "pnpm" },
  { file: "yarn.lock", id: "yarn" },
  { file: "package-lock.json", id: "npm" },
];

const MANAGER_META: Record<PkgManagerId, { lockFile: string; command: string }> = {
  npm: { lockFile: "package-lock.json", command: "npm" },
  pnpm: { lockFile: "pnpm-lock.yaml", command: "pnpm" },
  yarn: { lockFile: "yarn.lock", command: "yarn" },
  bun: { lockFile: "bun.lockb", command: "bun" },
};

export function detectPkgManager(cwd: string = process.cwd()): PkgManagerInfo {
  let dir = cwd;
  const root = dirname(dir) === dir ? dir : undefined;

  while (true) {
    for (const { file, id } of LOCK_FILES) {
      if (existsSync(join(dir, file))) {
        const meta = MANAGER_META[id];
        return { id, lockFile: meta.lockFile, command: meta.command };
      }
    }

    const parent = dirname(dir);
    if (parent === dir || parent === root) break;
    dir = parent;
  }

  // Fallback to npm
  return { id: "npm", lockFile: "package-lock.json", command: "npm" };
}

interface TranslatedCommand {
  command: string;
  args: string[];
}

type TranslationEntry = string[] | null;

const TRANSLATIONS: Record<string, Partial<Record<PkgManagerId, TranslationEntry>>> = {
  "install": {}, // same for all
  "add": {
    npm: ["install"],
  },
  "remove": {
    npm: ["uninstall"],
  },
  "run": {}, // same for all
  "publish": {
    bun: null,
  },
  "audit": {
    bun: null,
  },
  "outdated": {
    bun: null,
  },
  "ls": {
    yarn: ["list"],
    bun: null,
  },
  "pack": {
    bun: null,
  },
  "version": {}, // same for all
  "login": {
    bun: null,
  },
  "logout": {
    bun: null,
  },
  "config": {}, // same for all
  "whoami": {
    bun: null,
  },
  "info": {
    npm: ["info"],
    pnpm: ["info"],
    yarn: ["info"],
    bun: null,
  },
  "search": {
    pnpm: null,
    yarn: null,
    bun: null,
  },
  "init": {}, // same for all
};

export class UnsupportedCommandError extends Error {
  constructor(command: string, manager: PkgManagerId) {
    super(`"${command}" is not supported by ${manager}`);
    this.name = "UnsupportedCommandError";
  }
}

/**
 * Translate npm-canonical base args to the detected package manager.
 * Input: the base array from CommandDef (e.g. ["install"], ["add", "<pkg>"], ["run", "<script>"])
 * The first element is the subcommand; remaining elements are passthrough args.
 */
export function translateCommand(base: string[], manager: PkgManagerId): TranslatedCommand {
  const [subcommand, ...rest] = base;
  if (!subcommand) {
    return { command: manager, args: [] };
  }

  const translation = TRANSLATIONS[subcommand];

  if (translation) {
    const managerEntry = translation[manager];
    if (managerEntry === null) {
      throw new UnsupportedCommandError(subcommand, manager);
    }
    if (managerEntry !== undefined) {
      return { command: manager, args: [...managerEntry, ...rest] };
    }
  }

  // No translation needed — use as-is
  return { command: manager, args: [subcommand, ...rest] };
}

/**
 * Resolve pkg command base args for the current project's package manager.
 * Used by MCP and pipeline engine before execution.
 */
export function resolvePkgArgs(base: string[], cwd: string = process.cwd()): TranslatedCommand {
  const mgr = detectPkgManager(cwd);
  return translateCommand(base, mgr.id);
}
