import type { CommandDef } from "../types.js";

export const gitCommands: CommandDef[] = [
  { id: "git:status",   tool: "git", base: ["status"],   label: "status",   hint: "Show working tree status" },
  { id: "git:add",      tool: "git", base: ["add"],      label: "add",      hint: "Stage changes" },
  { id: "git:commit",   tool: "git", base: ["commit"],   label: "commit",   hint: "Create a commit" },
  { id: "git:push",     tool: "git", base: ["push"],     label: "push",     hint: "Push to remote" },
  { id: "git:pull",     tool: "git", base: ["pull"],     label: "pull",     hint: "Pull from remote" },
  { id: "git:checkout", tool: "git", base: ["checkout"], label: "checkout", hint: "Switch branches" },
  { id: "git:branch",   tool: "git", base: ["branch"],   label: "branch",   hint: "List or create branches" },
  { id: "git:stash",    tool: "git", base: ["stash"],    label: "stash",    hint: "Stash changes" },
  { id: "git:diff",     tool: "git", base: ["diff"],     label: "diff",     hint: "Show changes" },
  { id: "git:log",      tool: "git", base: ["log"],      label: "log",      hint: "View commit history" },
  { id: "git:merge",    tool: "git", base: ["merge"],    label: "merge",    hint: "Merge branches" },
];
