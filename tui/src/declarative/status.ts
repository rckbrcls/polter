import { execSync } from "node:child_process";
import type { StatusResult } from "./schema.js";
import { commandExists } from "../lib/system.js";

function safeExec(cmd: string): string | undefined {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return undefined;
  }
}

export function getCurrentStatus(cwd: string = process.cwd()): StatusResult {
  const result: StatusResult = {};

  // Supabase status
  if (commandExists("supabase")) {
    const linked = safeExec(`cd "${cwd}" && supabase projects list 2>/dev/null`) !== undefined;
    result.supabase = {
      linked,
      projectRef: undefined,
      functions: [],
    };

    const functionsOutput = safeExec(`cd "${cwd}" && supabase functions list 2>/dev/null`);
    if (functionsOutput) {
      result.supabase.functions = functionsOutput
        .split("\n")
        .filter((line) => line.trim() && !line.startsWith("│") && !line.startsWith("┌"))
        .slice(1);
    }
  }

  // Vercel status
  if (commandExists("vercel")) {
    const whoami = safeExec("vercel whoami 2>/dev/null");
    result.vercel = {
      linked: !!whoami,
      projectId: undefined,
    };
  }

  // GitHub status
  if (commandExists("gh")) {
    const authStatus = safeExec("gh auth status 2>&1");
    const authenticated = authStatus?.includes("Logged in") ?? false;
    const repoOutput = safeExec(`cd "${cwd}" && gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null`);

    result.github = {
      repo: repoOutput || undefined,
      authenticated,
    };
  }

  return result;
}
