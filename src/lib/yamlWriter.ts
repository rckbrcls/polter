import type { PolterYaml } from "../declarative/schema.js";

export function generatePolterYaml(config: PolterYaml): string {
  const lines: string[] = [];

  lines.push(`version: ${config.version}`);

  if (config.project) {
    lines.push("");
    lines.push("project:");
    lines.push(`  name: ${quote(config.project.name)}`);
  }

  if (config.supabase) {
    lines.push("");
    lines.push("supabase:");
    if (config.supabase.project_ref) {
      lines.push(`  project_ref: ${quote(config.supabase.project_ref)}`);
    }
    if (config.supabase.region) {
      lines.push(`  region: ${quote(config.supabase.region)}`);
    }
    if (config.supabase.database) {
      lines.push("  database:");
      if (config.supabase.database.migrations_dir) {
        lines.push(`    migrations_dir: ${quote(config.supabase.database.migrations_dir)}`);
      }
    }
    if (config.supabase.functions && config.supabase.functions.length > 0) {
      lines.push("  functions:");
      for (const fn of config.supabase.functions) {
        lines.push(`    - name: ${quote(fn.name)}`);
        if (fn.verify_jwt !== undefined) {
          lines.push(`      verify_jwt: ${fn.verify_jwt}`);
        }
      }
    }
    if (config.supabase.secrets && config.supabase.secrets.length > 0) {
      lines.push("  secrets:");
      for (const secret of config.supabase.secrets) {
        lines.push(`    - ${quote(secret)}`);
      }
    }
  }

  if (config.vercel) {
    lines.push("");
    lines.push("vercel:");
    if (config.vercel.project_id) {
      lines.push(`  project_id: ${quote(config.vercel.project_id)}`);
    }
    if (config.vercel.framework) {
      lines.push(`  framework: ${quote(config.vercel.framework)}`);
    }
    if (config.vercel.domains && config.vercel.domains.length > 0) {
      lines.push("  domains:");
      for (const domain of config.vercel.domains) {
        lines.push(`    - ${quote(domain)}`);
      }
    }
    if (config.vercel.env) {
      lines.push("  env:");
      for (const [env, vars] of Object.entries(config.vercel.env)) {
        lines.push(`    ${env}:`);
        for (const [key, value] of Object.entries(vars)) {
          lines.push(`      ${key}: ${quote(value)}`);
        }
      }
    }
  }

  if (config.github) {
    lines.push("");
    lines.push("github:");
    if (config.github.repo) {
      lines.push(`  repo: ${quote(config.github.repo)}`);
    }
    if (config.github.branch_protection) {
      lines.push("  branch_protection:");
      for (const [branch, rules] of Object.entries(config.github.branch_protection)) {
        lines.push(`    ${branch}:`);
        if (rules.required_reviews !== undefined) {
          lines.push(`      required_reviews: ${rules.required_reviews}`);
        }
        if (rules.require_status_checks !== undefined) {
          lines.push(`      require_status_checks: ${rules.require_status_checks}`);
        }
      }
    }
    if (config.github.secrets && config.github.secrets.length > 0) {
      lines.push("  secrets:");
      for (const secret of config.github.secrets) {
        lines.push(`    - ${quote(secret)}`);
      }
    }
  }

  if (config.pkg) {
    lines.push("");
    lines.push("pkg:");
    if (config.pkg.manager) {
      lines.push(`  manager: ${config.pkg.manager}`);
    }
  }

  if (config.pipelines) {
    lines.push("");
    lines.push("pipelines:");
    for (const [name, pipeline] of Object.entries(config.pipelines)) {
      lines.push(`  ${name}:`);
      if (pipeline.description) {
        lines.push(`    description: ${quote(pipeline.description)}`);
      }
      lines.push("    steps:");
      for (const step of pipeline.steps) {
        lines.push(`      - ${quote(step)}`);
      }
    }
  }

  lines.push("");
  return lines.join("\n");
}

function needsQuoting(value: string): boolean {
  if (!value) return true;
  if (/^[\d]/.test(value) && /[^\d.]/.test(value)) return true;
  if (/[:#\[\]{}&*!|>'"%@`]/.test(value)) return true;
  if (value === "true" || value === "false" || value === "null") return true;
  if (value.includes(" ") && !value.startsWith('"')) return true;
  return false;
}

function quote(value: string): string {
  if (needsQuoting(value)) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return value;
}
