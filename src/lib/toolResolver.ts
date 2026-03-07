import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveSupabaseCommand, type CommandExecution } from "./runner.js";
import { commandExists, execCapture } from "./system.js";
import type { CliToolId } from "../data/types.js";
import { detectPkgManager } from "./pkgManager.js";

export interface ToolResolution extends CommandExecution {
  source: "repository" | "path" | "not-found";
}

export interface ToolInfo {
  id: CliToolId;
  label: string;
  installed: boolean;
  version?: string;
}

export function getToolDisplayName(toolId: CliToolId, cwd: string = process.cwd()): string {
  if (toolId === "pkg") {
    const mgr = detectPkgManager(cwd);
    return mgr.id;
  }
  const names: Record<CliToolId, string> = {
    supabase: "supabase",
    gh: "github",
    vercel: "vercel",
    git: "git",
    pkg: "npm",
  };
  return names[toolId];
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

  if (toolId === "pkg") {
    const mgr = detectPkgManager(cwd);
    if (!commandExists(mgr.command)) {
      return { command: mgr.command, source: "not-found" };
    }
    return { command: mgr.command, env: { ...process.env }, source: "path" };
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
      case "pkg": {
        const mgr = detectPkgManager();
        return execCapture(`${mgr.command} --version`).split("\n")[0]?.trim();
      }
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
    pkg: "Package Manager",
  };

  const commandName = toolId === "supabase" ? "supabase" : toolId === "pkg" ? detectPkgManager().command : toolId;
  const installed = commandExists(commandName);
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

export interface ToolLinkInfo extends ToolInfo {
  linked: boolean;
  project?: string;
}

function detectSupabaseLink(cwd: string): { linked: boolean; project?: string } {
  try {
    const configPath = join(cwd, ".supabase", "config.toml");
    if (existsSync(configPath)) {
      const content = readFileSync(configPath, "utf-8");
      const match = content.match(/project_id\s*=\s*"([^"]+)"/);
      return { linked: true, project: match?.[1] };
    }
  } catch { /* ignore */ }
  return { linked: false };
}

function detectVercelLink(cwd: string): { linked: boolean; project?: string } {
  try {
    const projectPath = join(cwd, ".vercel", "project.json");
    if (existsSync(projectPath)) {
      const data = JSON.parse(readFileSync(projectPath, "utf-8"));
      return { linked: true, project: data.projectId };
    }
  } catch { /* ignore */ }
  return { linked: false };
}

function detectPkgLink(cwd: string): { linked: boolean; project?: string } {
  try {
    const pkgPath = join(cwd, "package.json");
    if (existsSync(pkgPath)) {
      const data = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const mgr = detectPkgManager(cwd);
      return { linked: true, project: data.name ? `${data.name} (${mgr.id})` : mgr.id };
    }
  } catch { /* ignore */ }
  return { linked: false };
}

function detectGhLink(cwd: string): { linked: boolean; project?: string } {
  try {
    const remote = execCapture(`git -C "${cwd}" remote get-url origin 2>/dev/null`);
    if (remote) {
      const match = remote.match(/[/:]([\w.-]+\/[\w.-]+?)(?:\.git)?$/);
      return { linked: true, project: match?.[1] ?? remote };
    }
  } catch { /* ignore */ }
  return { linked: false };
}

const toolLinkCache = new Map<CliToolId, ToolLinkInfo>();

export function getToolLinkInfo(toolId: CliToolId, cwd: string = process.cwd()): ToolLinkInfo {
  const cached = toolLinkCache.get(toolId);
  if (cached) return cached;

  const base = getToolInfo(toolId);
  let linkStatus: { linked: boolean; project?: string } = { linked: false };

  if (base.installed) {
    switch (toolId) {
      case "supabase":
        linkStatus = detectSupabaseLink(cwd);
        break;
      case "vercel":
        linkStatus = detectVercelLink(cwd);
        break;
      case "gh":
        linkStatus = detectGhLink(cwd);
        break;
      case "pkg":
        linkStatus = detectPkgLink(cwd);
        break;
    }
  }

  const info: ToolLinkInfo = { ...base, ...linkStatus };
  toolLinkCache.set(toolId, info);
  return info;
}
