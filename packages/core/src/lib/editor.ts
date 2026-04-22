import { spawnSync, spawn } from "node:child_process";
import { basename } from "node:path";

const TERMINAL_EDITORS = new Set([
  "vi", "vim", "nvim", "nano", "pico", "emacs",
  "micro", "helix", "hx", "joe", "mcedit",
]);

export interface ResolvedEditor {
  command: string;
  args: string[];
}

export interface EditorResult {
  exitCode: number | null;
  isTerminal: boolean;
}

export function resolveEditor(): ResolvedEditor {
  const raw = process.env["VISUAL"] || process.env["EDITOR"];

  if (raw) {
    const parts = raw.trim().split(/\s+/);
    return { command: parts[0]!, args: parts.slice(1) };
  }

  const fallback = process.platform === "win32" ? "notepad" : "nano";
  return { command: fallback, args: [] };
}

export function isTerminalEditor(cmd: string): boolean {
  return TERMINAL_EDITORS.has(basename(cmd));
}

export function openInEditor(filePath: string): EditorResult {
  const editor = resolveEditor();
  const terminal = isTerminalEditor(editor.command);

  if (terminal) {
    const result = spawnSync(editor.command, [...editor.args, filePath], {
      stdio: "inherit",
    });
    return { exitCode: result.status, isTerminal: true };
  }

  const child = spawn(editor.command, [...editor.args, filePath], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  return { exitCode: 0, isTerminal: false };
}
