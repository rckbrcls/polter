import { stripAnsi } from "./ansi.js";
import type { CliToolId } from "../data/types.js";

export interface ErrorSuggestion {
  tool: CliToolId;
  args: string[];
  display: string;
}

const KNOWN_TOOLS: CliToolId[] = ["supabase", "gh", "vercel", "git"];

const BACKTICK_CMD =
  /(?:try\s+)?(?:run(?:ning)?|use|execute)\s+`([^`]+)`/gi;
const HAVE_YOU_RUN =
  /have you (?:run|tried|used)\s+((?:supabase|gh|vercel|git)\s+[\w][\w -]*\w)\??/gi;
const DID_YOU_MEAN =
  /did you mean[:\s]+[`']?([a-z][\w -]*\w)[`']?\??/gi;
const INDENTED_TOOL_CMD =
  /^\s{2,}((?:supabase|gh|vercel|git)\s+[\w][\w -]*\w)$/gm;
const ARROW_BULLET =
  /[→•\-*]\s*(?:run:?\s*)?((?:supabase|gh|vercel|git)\s+[\w][\w -]*\w)/gim;

const MAX_SUGGESTIONS = 3;

function detectTool(rawCommand: string, fallback: CliToolId): CliToolId {
  const first = rawCommand.trim().split(/\s+/)[0]?.toLowerCase();
  const match = KNOWN_TOOLS.find((t) => t === first);
  return match ?? fallback;
}

function parseRawCommand(
  raw: string,
  currentTool: CliToolId,
): ErrorSuggestion {
  const trimmed = raw.trim();
  const tool = detectTool(trimmed, currentTool);
  const parts = trimmed.split(/\s+/);
  // If the command starts with the tool name, strip it from args
  const args = parts[0]?.toLowerCase() === tool ? parts.slice(1) : parts;
  const display = `${tool} ${args.join(" ")}`;
  return { tool, args, display };
}

export function parseErrorSuggestions(
  stdout: string,
  stderr: string,
  currentTool: CliToolId,
): ErrorSuggestion[] {
  const combined = stripAnsi(`${stdout}\n${stderr}`);
  const seen = new Set<string>();
  const suggestions: ErrorSuggestion[] = [];

  const patterns = [BACKTICK_CMD, HAVE_YOU_RUN, DID_YOU_MEAN, INDENTED_TOOL_CMD, ARROW_BULLET];

  for (const pattern of patterns) {
    // Reset lastIndex for each pass
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(combined)) !== null) {
      const raw = match[1]!;
      const suggestion = parseRawCommand(raw, currentTool);
      const key = suggestion.display;
      if (!seen.has(key)) {
        seen.add(key);
        suggestions.push(suggestion);
      }
      if (suggestions.length >= MAX_SUGGESTIONS) break;
    }
    if (suggestions.length >= MAX_SUGGESTIONS) break;
  }

  return suggestions;
}
