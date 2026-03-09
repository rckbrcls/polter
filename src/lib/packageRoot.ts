import { existsSync } from "./fs.js";
import { dirname, join, resolve } from "node:path";

const rootCache = new Map<string, string | undefined>();

export function findNearestPackageRoot(
  startDir: string = process.cwd(),
): string | undefined {
  const resolvedStart = resolve(startDir);
  if (rootCache.has(resolvedStart)) return rootCache.get(resolvedStart);

  let currentDir = resolvedStart;

  while (true) {
    if (existsSync(join(currentDir, "package.json"))) {
      rootCache.set(resolvedStart, currentDir);
      return currentDir;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      rootCache.set(resolvedStart, undefined);
      return undefined;
    }

    currentDir = parentDir;
  }
}
