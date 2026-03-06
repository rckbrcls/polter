import type { CliToolId } from "./types.js";

export interface FlagDef {
  value: string;
  label: string;
  hint?: string;
}

export const globalFlags: FlagDef[] = [
  { value: "--debug", label: "--debug", hint: "Output debug logs to stderr" },
  { value: "--yes", label: "--yes", hint: "Answer yes to all prompts" },
  {
    value: "--create-ticket",
    label: "--create-ticket",
    hint: "Create support ticket on error",
  },
  {
    value: "--experimental",
    label: "--experimental",
    hint: "Enable experimental features",
  },
];

export const toolFlags: Record<CliToolId, FlagDef[]> = {
  supabase: globalFlags,
  gh: [],
  vercel: [
    { value: "--yes", label: "--yes", hint: "Skip confirmation prompts" },
    { value: "--debug", label: "--debug", hint: "Debug mode" },
  ],
  git: [],
};

export function getFlagsForTool(toolId: CliToolId): FlagDef[] {
  return toolFlags[toolId] ?? globalFlags;
}
