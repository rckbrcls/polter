import { resolveSupabaseCommand, type CommandExecution } from "./runner.js";
import { commandExists, execCapture } from "./system.js";
import type { CliToolId } from "../data/types.js";

export interface ToolResolution extends CommandExecution {
  source: "repository" | "path" | "not-found";
}

export interface ToolInfo {
  id: CliToolId;
  label: string;
  installed: boolean;
  version?: string;
}

export function resolveToolCommand(
  toolId: CliToolId,
  cwd: string = process.cwd(),
): ToolResolution {
  if (toolId === "supabase") {
    const resolved = resolveSupabaseCommand(cwd);
    return {
      command: resolved.command,
      env: resolved.env,
      source: resolved.source,
    };
  }

  const command = toolId;
  if (!commandExists(command)) {
    return { command, source: "not-found" };
  }

  return { command, env: { ...process.env }, source: "path" };
}

export function getToolVersion(toolId: CliToolId): string | undefined {
  try {
    switch (toolId) {
      case "supabase":
        return execCapture("supabase --version").replace(/^supabase\s+/i, "");
      case "gh":
        return execCapture("gh --version").split("\n")[0]?.replace(/^gh\s+version\s+/i, "").split(" ")[0];
      case "vercel":
        return execCapture("vercel --version").split("\n")[0]?.trim();
      case "git":
        return execCapture("git --version").replace(/^git version\s+/i, "").trim();
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

const toolInfoCache = new Map<CliToolId, ToolInfo>();

export function getToolInfo(toolId: CliToolId): ToolInfo {
  const cached = toolInfoCache.get(toolId);
  if (cached) return cached;
  const labels: Record<CliToolId, string> = {
    supabase: "Supabase CLI",
    gh: "GitHub CLI",
    vercel: "Vercel CLI",
    git: "Git",
  };

  const installed = commandExists(toolId === "supabase" ? "supabase" : toolId);
  const version = installed ? getToolVersion(toolId) : undefined;

  const info: ToolInfo = {
    id: toolId,
    label: labels[toolId],
    installed,
    version,
  };
  toolInfoCache.set(toolId, info);
  return info;
}
