export const CLI_TOOL_IDS = ["supabase", "gh", "vercel", "git", "pkg"] as const;
export type CliToolId = (typeof CLI_TOOL_IDS)[number];

export interface CommandDef {
  id: string;
  tool: CliToolId;
  base: string[];
  label: string;
  hint?: string;
  suggestedArgs?: SuggestedArg[];
  editorTarget?: "config" | "code";
  interactive?: boolean;
}

export interface SuggestedArg {
  value: string;
  label: string;
  hint?: string;
  args: string[];
}

export interface Feature {
  id: string;
  icon: string;
  label: string;
  commands: CommandDef[];
}

export interface PipelineStep {
  id: string;
  commandId: string;
  args: string[];
  flags: string[];
  continueOnError: boolean;
  label?: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  steps: PipelineStep[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectConfig {
  version: 1;
  tools: {
    supabase?: { projectRef?: string };
    vercel?: { projectId?: string; orgId?: string };
    gh?: { repo?: string };
    git?: {};
    pkg?: { manager?: import("../lib/pkgManager.js").PkgManagerId };
  };
  env?: Record<string, string>;
  childRepos?: string[];
  pipelines: Pipeline[];
}

export type Screen =
  | "home"
  | "feature-detail"
  | "command-args"
  | "flag-selection"
  | "command-execution"
  | "confirm-execute"
  | "custom-command"
  | "self-update"
  | "pipeline-list"
  | "pipeline-builder"
  | "pipeline-execution"
  | "project-config"
  | "tool-status"
  | "mcp-manage"
  | "process-list"
  | "process-logs"
  | "declarative-plan"
  | "declarative-status"
  | "init-scaffold"
  | "script-picker"
  | "skill-setup";
