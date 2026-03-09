import { existsSync, readFileSync } from "../lib/fs.js";
import { join } from "node:path";
import { PolterYamlSchema, type PolterYaml } from "./schema.js";

const YAML_FILE = "polter.yaml";

/**
 * Simple YAML parser for polter.yaml.
 * Supports basic key: value, nested objects, arrays with -, and string values.
 * Does NOT require an external dependency.
 */
function parseSimpleYaml(content: string): Record<string, unknown> {
  const lines = content.split("\n");
  const result: Record<string, unknown> = {};
  const stack: Array<{ obj: Record<string, unknown>; indent: number }> = [
    { obj: result, indent: -1 },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.replace(/\s+$/, "");

    // Skip empty lines and comments
    if (!trimmed || trimmed.match(/^\s*#/)) continue;

    const indent = line.search(/\S/);
    if (indent < 0) continue;

    // Pop stack to matching indent level
    while (stack.length > 1 && stack[stack.length - 1]!.indent >= indent) {
      stack.pop();
    }

    const current = stack[stack.length - 1]!.obj;
    const content_ = trimmed.trim();

    // Array item
    if (content_.startsWith("- ")) {
      const parentKey = Object.keys(current).pop();
      if (parentKey) {
        const arr = current[parentKey];
        if (Array.isArray(arr)) {
          const val = content_.slice(2).trim();
          // Check if it's a key: value on the same line
          const colonIdx = val.indexOf(":");
          if (colonIdx > 0 && !val.startsWith('"') && !val.startsWith("'")) {
            const key = val.slice(0, colonIdx).trim();
            const rest = val.slice(colonIdx + 1).trim();
            const obj: Record<string, unknown> = { [key]: parseValue(rest) };
            arr.push(obj);
            stack.push({ obj, indent: indent + 2 });
          } else {
            arr.push(parseValue(val));
          }
        }
      }
      continue;
    }

    // Key: value
    const colonIdx = content_.indexOf(":");
    if (colonIdx > 0) {
      const key = content_.slice(0, colonIdx).trim();
      const rest = content_.slice(colonIdx + 1).trim();

      if (rest === "" || rest === "|" || rest === ">") {
        // Nested object or array - check next line
        const nextLine = lines[i + 1];
        const nextTrimmed = nextLine?.trim();
        if (nextTrimmed?.startsWith("- ")) {
          current[key] = [];
        } else {
          const nested: Record<string, unknown> = {};
          current[key] = nested;
          stack.push({ obj: nested, indent });
        }
      } else {
        current[key] = parseValue(rest);
      }
    }
  }

  return result;
}

function parseValue(raw: string): unknown {
  if (!raw) return "";

  // Remove quotes
  if ((raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }

  // Booleans
  if (raw === "true") return true;
  if (raw === "false") return false;

  // Numbers
  const num = Number(raw);
  if (!isNaN(num) && raw !== "") return num;

  return raw;
}

export function findPolterYaml(
  startDir: string = process.cwd(),
): string | undefined {
  const filePath = join(startDir, YAML_FILE);
  return existsSync(filePath) ? filePath : undefined;
}

export function parsePolterYaml(
  startDir: string = process.cwd(),
): PolterYaml | undefined {
  const filePath = findPolterYaml(startDir);
  if (!filePath) return undefined;

  const content = readFileSync(filePath, "utf-8");
  const raw = parseSimpleYaml(content);

  const result = PolterYamlSchema.safeParse(raw);
  return result.success ? result.data : undefined;
}
