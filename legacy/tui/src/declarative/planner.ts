import type { PolterYaml, PlanAction, PlanResult } from "./schema.js";
import { getCurrentStatus } from "./status.js";

export function planChanges(
  desired: PolterYaml,
  cwd: string = process.cwd(),
): PlanResult {
  const current = getCurrentStatus(cwd);
  const actions: PlanAction[] = [];

  // Supabase functions
  if (desired.supabase?.functions) {
    const currentFunctions = new Set(current.supabase?.functions ?? []);

    for (const fn of desired.supabase.functions) {
      if (!currentFunctions.has(fn.name)) {
        const args = ["functions", "deploy", fn.name];
        if (fn.verify_jwt === false) {
          args.push("--no-verify-jwt");
        }
        actions.push({
          tool: "supabase",
          action: "create",
          resource: `function:${fn.name}`,
          description: `Deploy function "${fn.name}"`,
          args,
        });
      }
    }
  }

  // Supabase secrets
  if (desired.supabase?.secrets) {
    for (const secret of desired.supabase.secrets) {
      actions.push({
        tool: "supabase",
        action: "update",
        resource: `secret:${secret}`,
        description: `Ensure secret "${secret}" is set`,
        args: ["secrets", "set", secret],
      });
    }
  }

  // Vercel domains
  if (desired.vercel?.domains) {
    for (const domain of desired.vercel.domains) {
      actions.push({
        tool: "vercel",
        action: "create",
        resource: `domain:${domain}`,
        description: `Add domain "${domain}"`,
        args: ["domains", "add", domain],
      });
    }
  }

  // Vercel env vars
  if (desired.vercel?.env) {
    for (const [env, vars] of Object.entries(desired.vercel.env)) {
      for (const [key, value] of Object.entries(vars)) {
        actions.push({
          tool: "vercel",
          action: "update",
          resource: `env:${env}:${key}`,
          description: `Set env var "${key}" for ${env}`,
          args: ["env", "add", key, env],
        });
      }
    }
  }

  // GitHub secrets
  if (desired.github?.secrets) {
    for (const secret of desired.github.secrets) {
      actions.push({
        tool: "gh",
        action: "update",
        resource: `secret:${secret}`,
        description: `Ensure GitHub secret "${secret}" is set`,
        args: ["secret", "set", secret],
      });
    }
  }

  return {
    actions,
    noChanges: actions.length === 0,
  };
}
