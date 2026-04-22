// Legacy re-export. New code should use CommandDef.suggestedArgs from ./commands/index.js

export interface SuggestedArgOption {
  value: string;
  label: string;
  hint?: string;
  args: string[];
}

const suggestedArgsByCommand: Record<string, SuggestedArgOption[]> = {
  db: [
    { value: "pull", label: "pull", hint: "Pull schema from remote", args: ["pull"] },
    { value: "push", label: "push", hint: "Push local migrations", args: ["push"] },
    { value: "reset", label: "reset", hint: "Reset local database", args: ["reset"] },
    { value: "dump", label: "dump", hint: "Dump schema/data", args: ["dump"] },
    { value: "diff", label: "diff", hint: "Show migration diff", args: ["diff"] },
    { value: "lint", label: "lint", hint: "Lint SQL migrations", args: ["lint"] },
  ],
  migration: [
    { value: "new", label: "new <name>", hint: "Create migration file", args: ["new"] },
    { value: "up", label: "up", hint: "Apply pending migrations", args: ["up"] },
    { value: "down", label: "down", hint: "Rollback last migration", args: ["down"] },
    { value: "list", label: "list", hint: "List local migrations", args: ["list"] },
    { value: "repair", label: "repair", hint: "Repair migration history", args: ["repair"] },
    { value: "fetch", label: "fetch", hint: "Fetch migration history", args: ["fetch"] },
  ],
  projects: [
    { value: "list", label: "list", hint: "List projects", args: ["list"] },
    { value: "create", label: "create", hint: "Create project", args: ["create"] },
    { value: "delete", label: "delete", hint: "Delete project", args: ["delete"] },
  ],
  functions: [
    { value: "list", label: "list", hint: "List functions", args: ["list"] },
    { value: "new", label: "new <name>", hint: "Create a function", args: ["new"] },
    { value: "serve", label: "serve", hint: "Serve functions locally", args: ["serve"] },
    { value: "deploy", label: "deploy <name>", hint: "Deploy function", args: ["deploy"] },
    { value: "delete", label: "delete <name>", hint: "Delete function", args: ["delete"] },
  ],
  storage: [
    { value: "ls", label: "ls", hint: "List storage objects", args: ["ls"] },
    { value: "cp", label: "cp", hint: "Copy storage object", args: ["cp"] },
    { value: "mv", label: "mv", hint: "Move storage object", args: ["mv"] },
    { value: "rm", label: "rm", hint: "Remove storage object", args: ["rm"] },
  ],
  seed: [
    { value: "run", label: "run", hint: "Run configured seed file", args: ["run"] },
  ],
  orgs: [
    { value: "list", label: "list", hint: "List organizations", args: ["list"] },
    { value: "create", label: "create", hint: "Create organization", args: ["create"] },
  ],
  snippets: [
    { value: "list", label: "list", hint: "List SQL snippets", args: ["list"] },
    { value: "create", label: "create", hint: "Create SQL snippet", args: ["create"] },
    { value: "delete", label: "delete", hint: "Delete SQL snippet", args: ["delete"] },
  ],
  backups: [
    { value: "list", label: "list", hint: "List backups", args: ["list"] },
    { value: "download", label: "download", hint: "Download backup", args: ["download"] },
  ],
};

export function getSuggestedArgOptions(command: string): SuggestedArgOption[] {
  return suggestedArgsByCommand[command] ?? [];
}
