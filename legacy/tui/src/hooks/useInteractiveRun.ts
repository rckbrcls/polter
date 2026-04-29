import { useCallback } from "react";
import {
  ENTER_ALT_SCREEN,
  LEAVE_ALT_SCREEN,
  HIDE_CURSOR,
  SHOW_CURSOR,
} from "./useFullscreen.js";
import { runInteractiveCommand, type RunResult } from "../lib/runner.js";
import { resolveToolCommand } from "../lib/toolResolver.js";
import type { CliToolId } from "../data/types.js";

export function useInteractiveRun(): {
  runInteractive: (tool: CliToolId, args: string[], cwd?: string) => RunResult;
} {
  const runInteractive = useCallback(
    (tool: CliToolId, args: string[], cwd?: string) => {
      // Leave alt screen, show cursor, and clear the normal screen
      process.stdout.write(SHOW_CURSOR + LEAVE_ALT_SCREEN + "\x1b[2J\x1b[H");

      // Bypass Ink's ref-counted setRawMode — force cooked mode
      // Ink's useInput hooks keep the ref count > 0, so the Ink
      // setRawMode(false) never actually disables raw mode.
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }

      process.stdout.write(`\n  Running: ${tool} ${args.join(" ")}\n\n`);

      const resolved = resolveToolCommand(tool, cwd);
      const result = runInteractiveCommand(
        { command: resolved.command, env: resolved.env },
        args,
        cwd,
      );

      process.stdout.write(
        `\n  Command exited (code ${result.exitCode ?? "?"}). Returning to Polter...\n`,
      );

      // Restore raw mode and re-enter alt screen
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
      }
      process.stdout.write(ENTER_ALT_SCREEN + HIDE_CURSOR);

      return result;
    },
    [],
  );

  return { runInteractive };
}
