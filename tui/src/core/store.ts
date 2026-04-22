/**
 * Persistence abstraction — atomic JSON reads/writes with migration support.
 *
 * All file-based state (.polter/processes.json, .polter/history.jsonl, etc.)
 * should go through this module to get:
 * - Atomic writes (write to .tmp, then rename — no partial files on crash)
 * - Ensured directory creation
 * - Consistent error handling
 * - Migration hooks for schema evolution
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  renameSync,
} from "node:fs";
import { appendFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Atomically write a JSON file. Writes to a temp file first, then renames.
 * Creates parent directories if needed.
 */
export function writeJsonAtomic<T>(filePath: string, data: T): void {
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });

  const tmpPath = join(dir, `.${randomUUID()}.tmp`);
  writeFileSync(tmpPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  renameSync(tmpPath, filePath);
}

/**
 * Read and parse a JSON file. Returns `undefined` if the file doesn't
 * exist or fails to parse.
 */
export function readJson<T>(filePath: string): T | undefined {
  if (!existsSync(filePath)) return undefined;

  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

/**
 * Read, validate, and optionally migrate a JSON file.
 *
 * @param filePath - Path to the JSON file
 * @param validate - Returns the validated data or undefined if invalid
 * @param migrate  - Optional migration from an older schema version
 */
export function readJsonValidated<T>(
  filePath: string,
  validate: (raw: unknown) => T | undefined,
  migrate?: (raw: unknown) => unknown,
): T | undefined {
  const raw = readJson<unknown>(filePath);
  if (raw === undefined) return undefined;

  const migrated = migrate ? migrate(raw) : raw;
  return validate(migrated);
}

/**
 * Append a line to a JSONL (newline-delimited JSON) file.
 * Creates the file and parent directories if needed.
 */
export async function appendJsonl(filePath: string, record: unknown): Promise<void> {
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });

  const line = JSON.stringify(record) + "\n";
  await appendFile(filePath, line, "utf-8");
}

/**
 * Read all lines from a JSONL file. Returns an empty array if the file
 * doesn't exist or is empty.
 */
export function readJsonl<T>(filePath: string): T[] {
  if (!existsSync(filePath)) return [];

  try {
    const raw = readFileSync(filePath, "utf-8");
    return raw
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as T);
  } catch {
    return [];
  }
}
