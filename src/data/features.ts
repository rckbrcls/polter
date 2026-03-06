import type { Feature } from "./types.js";
import { supabaseCommands } from "./commands/supabase.js";
import { ghCommands } from "./commands/gh.js";
import { vercelCommands } from "./commands/vercel.js";
import { gitCommands } from "./commands/git.js";

function pick(ids: string[]) {
  const idSet = new Set(ids);
  return [...supabaseCommands, ...ghCommands, ...vercelCommands, ...gitCommands].filter(
    (cmd) => idSet.has(cmd.id),
  );
}

export const features: Feature[] = [
  {
    id: "database",
    icon: "🗄️",
    label: "Database",
    commands: pick([
      "supabase:db",
      "supabase:migration",
      "supabase:seed",
      "supabase:inspect",
    ]),
  },
  {
    id: "functions",
    icon: "⚡",
    label: "Functions",
    commands: pick([
      "supabase:functions",
    ]),
  },
  {
    id: "deploy",
    icon: "🚀",
    label: "Deploy",
    commands: pick([
      "supabase:db",
      "supabase:functions",
      "vercel:deploy",
      "vercel:deploy:prod",
      "vercel:promote",
      "vercel:rollback",
      "git:commit",
      "git:push",
    ]),
  },
  {
    id: "repo",
    icon: "📦",
    label: "Repo",
    commands: pick([
      "git:status",
      "git:add",
      "git:commit",
      "git:push",
      "git:pull",
      "git:branch",
      "git:checkout",
      "git:log",
      "git:diff",
      "git:merge",
      "git:stash",
      "gh:repo:clone",
      "gh:repo:create",
      "gh:repo:view",
      "gh:repo:list",
      "gh:pr:create",
      "gh:pr:list",
      "gh:pr:view",
      "gh:pr:merge",
      "gh:pr:checkout",
      "gh:pr:review",
      "gh:issue:create",
      "gh:issue:list",
      "gh:issue:view",
      "gh:issue:close",
      "gh:release:create",
      "gh:release:list",
      "gh:release:view",
    ]),
  },
  {
    id: "cicd",
    icon: "🔄",
    label: "CI/CD",
    commands: pick([
      "vercel:env:ls",
      "vercel:env:add",
      "vercel:env:rm",
      "vercel:env:pull",
      "gh:workflow:list",
      "gh:workflow:run",
      "gh:workflow:view",
      "gh:run:list",
      "gh:run:view",
      "gh:run:watch",
    ]),
  },
  {
    id: "auth-storage",
    icon: "🔐",
    label: "Auth & Storage",
    commands: pick([
      "supabase:storage",
      "supabase:secrets",
      "supabase:sso",
    ]),
  },
  {
    id: "networking",
    icon: "🌐",
    label: "Networking",
    commands: pick([
      "supabase:domains",
      "supabase:ssl-enforcement",
      "supabase:network-bans",
      "supabase:network-restrictions",
      "supabase:vanity-subdomains",
      "supabase:encryption",
      "vercel:domains:list",
      "vercel:domains:add",
      "vercel:domains:rm",
    ]),
  },
  {
    id: "setup",
    icon: "⚙️",
    label: "Setup",
    commands: pick([
      "supabase:init",
      "supabase:link",
      "supabase:login",
      "vercel:link",
      "vercel:login",
      "gh:auth:login",
      "gh:auth:status",
    ]),
  },
];

const featureById = new Map(features.map((f) => [f.id, f]));

export function getFeatureById(id: string): Feature | undefined {
  return featureById.get(id);
}
