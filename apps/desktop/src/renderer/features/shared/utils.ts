import type { CommandDef, Pipeline } from "../workbench/types.js";

export function splitArgs(raw: string): string[] {
  return raw.trim().split(/\s+/).filter(Boolean);
}

export function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function domSafeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function getCommandValue(command: CommandDef): string {
  if (command.tool === "supabase") {
    return command.base.join(" ");
  }
  return `${command.tool}:${command.base.join(" ")}`;
}

export function createEmptyPipeline(): Pipeline {
  return {
    id: "",
    name: "",
    description: "",
    steps: [],
    createdAt: "",
    updatedAt: "",
  };
}
