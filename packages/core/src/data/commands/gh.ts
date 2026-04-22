import type { CommandDef } from "../types.js";

export const ghCommands: CommandDef[] = [
  // Repository
  {
    id: "gh:repo:clone",
    tool: "gh",
    base: ["repo", "clone"],
    label: "repo clone",
    hint: "Clone a repository",
  },
  {
    id: "gh:repo:create",
    tool: "gh",
    base: ["repo", "create"],
    label: "repo create",
    hint: "Create a new repository",
    interactive: true,
  },
  {
    id: "gh:repo:view",
    tool: "gh",
    base: ["repo", "view"],
    label: "repo view",
    hint: "View repository details",
  },
  {
    id: "gh:repo:list",
    tool: "gh",
    base: ["repo", "list"],
    label: "repo list",
    hint: "List your repositories",
  },

  // Pull Requests
  {
    id: "gh:pr:create",
    tool: "gh",
    base: ["pr", "create"],
    label: "pr create",
    hint: "Create a pull request",
  },
  {
    id: "gh:pr:list",
    tool: "gh",
    base: ["pr", "list"],
    label: "pr list",
    hint: "List pull requests",
  },
  {
    id: "gh:pr:view",
    tool: "gh",
    base: ["pr", "view"],
    label: "pr view",
    hint: "View a pull request",
  },
  {
    id: "gh:pr:merge",
    tool: "gh",
    base: ["pr", "merge"],
    label: "pr merge",
    hint: "Merge a pull request",
  },
  {
    id: "gh:pr:checkout",
    tool: "gh",
    base: ["pr", "checkout"],
    label: "pr checkout",
    hint: "Check out a pull request",
  },
  {
    id: "gh:pr:review",
    tool: "gh",
    base: ["pr", "review"],
    label: "pr review",
    hint: "Review a pull request",
    suggestedArgs: [
      { value: "approve", label: "Approve", hint: "Approve the PR", args: ["--approve"] },
      { value: "comment", label: "Comment", hint: "Leave a comment", args: ["--comment"] },
      { value: "request-changes", label: "Request Changes", hint: "Request changes", args: ["--request-changes"] },
    ],
  },

  // Issues
  {
    id: "gh:issue:create",
    tool: "gh",
    base: ["issue", "create"],
    label: "issue create",
    hint: "Create an issue",
  },
  {
    id: "gh:issue:list",
    tool: "gh",
    base: ["issue", "list"],
    label: "issue list",
    hint: "List issues",
  },
  {
    id: "gh:issue:view",
    tool: "gh",
    base: ["issue", "view"],
    label: "issue view",
    hint: "View an issue",
  },
  {
    id: "gh:issue:close",
    tool: "gh",
    base: ["issue", "close"],
    label: "issue close",
    hint: "Close an issue",
  },

  // Workflows & Runs
  {
    id: "gh:workflow:list",
    tool: "gh",
    base: ["workflow", "list"],
    label: "workflow list",
    hint: "List workflows",
  },
  {
    id: "gh:workflow:run",
    tool: "gh",
    base: ["workflow", "run"],
    label: "workflow run",
    hint: "Run a workflow",
  },
  {
    id: "gh:workflow:view",
    tool: "gh",
    base: ["workflow", "view"],
    label: "workflow view",
    hint: "View a workflow",
  },
  {
    id: "gh:run:list",
    tool: "gh",
    base: ["run", "list"],
    label: "run list",
    hint: "List workflow runs",
  },
  {
    id: "gh:run:view",
    tool: "gh",
    base: ["run", "view"],
    label: "run view",
    hint: "View a workflow run",
  },
  {
    id: "gh:run:watch",
    tool: "gh",
    base: ["run", "watch"],
    label: "run watch",
    hint: "Watch a workflow run",
  },

  // Releases
  {
    id: "gh:release:create",
    tool: "gh",
    base: ["release", "create"],
    label: "release create",
    hint: "Create a release",
  },
  {
    id: "gh:release:list",
    tool: "gh",
    base: ["release", "list"],
    label: "release list",
    hint: "List releases",
  },
  {
    id: "gh:release:view",
    tool: "gh",
    base: ["release", "view"],
    label: "release view",
    hint: "View a release",
  },

  // Auth
  {
    id: "gh:auth:login",
    tool: "gh",
    base: ["auth", "login"],
    label: "auth login",
    hint: "Log in to GitHub",
    interactive: true,
  },
  {
    id: "gh:auth:status",
    tool: "gh",
    base: ["auth", "status"],
    label: "auth status",
    hint: "View auth status",
  },
];
