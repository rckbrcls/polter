import type { CommandDef, CliToolId } from "../types.js";
import { supabaseCommands } from "./supabase.js";
import { ghCommands } from "./gh.js";
import { vercelCommands } from "./vercel.js";
import { gitCommands } from "./git.js";
import { pkgCommands } from "./pkg.js";

export const allCommands: CommandDef[] = [
  ...supabaseCommands,
  ...ghCommands,
  ...vercelCommands,
  ...gitCommands,
  ...pkgCommands,
];

const commandById = new Map(allCommands.map((cmd) => [cmd.id, cmd]));
const commandByValue = new Map<string, CommandDef>(
  allCommands.map((cmd) => [getCommandValue(cmd), cmd]),
);

export function getCommandById(id: string): CommandDef | undefined {
  return commandById.get(id);
}

export function getCommandsByTool(tool: CliToolId): CommandDef[] {
  return allCommands.filter((cmd) => cmd.tool === tool);
}

/**
 * Build a legacy-compatible command value from a CommandDef.
 * For supabase commands, the value is the base[0] (e.g. "db", "migration").
 * For other tools, the value is "tool:base" (e.g. "gh:pr create").
 */
export function getCommandValue(cmd: CommandDef): string {
  if (cmd.tool === "supabase") {
    return cmd.base.join(" ");
  }
  return `${cmd.tool}:${cmd.base.join(" ")}`;
}

/**
 * Find a command def by its legacy value (e.g. "db" or "gh:pr create").
 */
export function findCommandByValue(value: string): CommandDef | undefined {
  const byId = commandById.get(value);
  if (byId) return byId;
  return commandByValue.get(value);
}
