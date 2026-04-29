// Re-export for backward compatibility with existing code and tests.
// New code should import from ./commands/index.js and ./features.js instead.

export interface CommandOption {
  value: string;
  label: string;
  hint?: string;
}

export interface Category {
  icon: string;
  label: string;
  description: string;
  commands: CommandOption[];
}

export const categories: Record<string, Category> = {
  "quick-start": {
    icon: "🚀",
    label: "Quick Start",
    description: "Get started with Supabase",
    commands: [
      {
        value: "bootstrap",
        label: "bootstrap",
        hint: "Bootstrap from a starter template",
      },
      { value: "init", label: "init", hint: "Initialize a local project" },
      {
        value: "login",
        label: "login",
        hint: "Authenticate with access token",
      },
      { value: "logout", label: "logout", hint: "Remove local auth token" },
    ],
  },
  "local-dev": {
    icon: "🛠",
    label: "Local Dev",
    description: "Day-to-day local workflow",
    commands: [
      {
        value: "start",
        label: "start",
        hint: "Start local Supabase containers",
      },
      { value: "stop", label: "stop", hint: "Stop local Supabase containers" },
      { value: "status", label: "status", hint: "Show container status" },
      { value: "db", label: "db", hint: "Manage Postgres databases" },
      {
        value: "migration",
        label: "migration",
        hint: "Manage migration scripts",
      },
      { value: "seed", label: "seed", hint: "Seed from config.toml" },
      { value: "test", label: "test", hint: "Run tests on local stack" },
    ],
  },
  "inspect-generate": {
    icon: "🔍",
    label: "Inspect & Generate",
    description: "Tooling and introspection",
    commands: [
      { value: "inspect", label: "inspect", hint: "Inspect project resources" },
      { value: "gen", label: "gen", hint: "Run code generation tools" },
      { value: "services", label: "services", hint: "Show service versions" },
      { value: "link", label: "link", hint: "Link to remote project" },
      { value: "unlink", label: "unlink", hint: "Unlink remote project" },
    ],
  },
  cloud: {
    icon: "☁️",
    label: "Cloud Management",
    description: "Core cloud resources",
    commands: [
      {
        value: "projects",
        label: "projects",
        hint: "Manage Supabase projects",
      },
      { value: "functions", label: "functions", hint: "Manage Edge Functions" },
      { value: "secrets", label: "secrets", hint: "Manage project secrets" },
      {
        value: "config",
        label: "config",
        hint: "Manage project configuration",
      },
      { value: "storage", label: "storage", hint: "Manage Storage objects" },
    ],
  },
  networking: {
    icon: "🌐",
    label: "Networking & Security",
    description: "Network and security config",
    commands: [
      { value: "domains", label: "domains", hint: "Manage custom domains" },
      {
        value: "ssl-enforcement",
        label: "ssl-enforcement",
        hint: "Manage SSL config",
      },
      {
        value: "network-bans",
        label: "network-bans",
        hint: "Manage network bans",
      },
      {
        value: "network-restrictions",
        label: "network-restrictions",
        hint: "Manage network restrictions",
      },
      {
        value: "vanity-subdomains",
        label: "vanity-subdomains",
        hint: "Manage vanity subdomains",
      },
      {
        value: "encryption",
        label: "encryption",
        hint: "Manage encryption keys",
      },
    ],
  },
  "org-auth": {
    icon: "👥",
    label: "Organizations & Admin",
    description: "Team management and admin tools",
    commands: [
      { value: "orgs", label: "orgs", hint: "Manage organizations" },
      { value: "sso", label: "sso", hint: "Manage Single Sign-On" },
      { value: "branches", label: "branches", hint: "Manage preview branches" },
      { value: "backups", label: "backups", hint: "Manage physical backups" },
      { value: "snippets", label: "snippets", hint: "Manage SQL snippets" },
      {
        value: "postgres-config",
        label: "postgres-config",
        hint: "Manage Postgres config",
      },
    ],
  },
  utilities: {
    icon: "⚙️",
    label: "Utilities",
    description: "Help and shell completions",
    commands: [
      {
        value: "completion",
        label: "completion",
        hint: "Generate shell completion script",
      },
      { value: "help", label: "help", hint: "Help about any command" },
    ],
  },
};

export function getCategoryOptions() {
  return Object.entries(categories).map(([key, cat]) => ({
    value: key,
    label: `${cat.icon}  ${cat.label}`,
    hint: cat.description,
  }));
}

export function getCommandOptions(categoryKey: string) {
  const cat = categories[categoryKey];
  if (!cat) return [];
  return cat.commands.map((cmd) => ({
    value: cmd.value,
    label: cmd.label,
    hint: cmd.hint,
  }));
}
