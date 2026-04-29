import { existsSync, readFileSync, readdirSync } from "./fs.js";
import { join, relative } from "node:path";
import { detectPkgManager, type PkgManagerInfo } from "./pkgManager.js";

export interface ScriptEntry {
  name: string;
  command: string;
}

export interface ChildRepo {
  name: string;
  path: string;
  scripts: ScriptEntry[];
  pkgManager: PkgManagerInfo;
}

export function readScripts(cwd: string): ScriptEntry[] {
  const pkgPath = join(cwd, "package.json");
  if (!existsSync(pkgPath)) return [];
  try {
    const raw = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const scripts: Record<string, string> = raw.scripts ?? {};
    return Object.entries(scripts).map(([name, command]) => ({ name, command }));
  } catch {
    return [];
  }
}

const SKIP_DIRS = new Set(["node_modules", ".git"]);

export function discoverChildRepos(
  parentDir: string,
  configured?: string[],
): ChildRepo[] {
  const dirs: string[] = [];

  if (configured && configured.length > 0) {
    for (const rel of configured) {
      const abs = join(parentDir, rel);
      if (existsSync(join(abs, "package.json"))) {
        dirs.push(abs);
      }
    }
  } else {
    const MAX_DEPTH = 3;
    const scanDir = (dir: string, depth: number): void => {
      if (depth > MAX_DEPTH) return;
      try {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
          const abs = join(dir, entry.name);
          if (existsSync(join(abs, "package.json"))) {
            dirs.push(abs);
          }
          scanDir(abs, depth + 1);
        }
      } catch {
        // permission error or unreadable dir — skip
      }
    };
    scanDir(parentDir, 1);
  }

  const repos: ChildRepo[] = [];
  for (const dir of dirs) {
    const scripts = readScripts(dir);
    if (scripts.length === 0) continue;
    repos.push({
      name: relative(parentDir, dir),
      path: dir,
      scripts,
      pkgManager: detectPkgManager(dir),
    });
  }

  return repos.sort((a, b) => a.name.localeCompare(b.name));
}
