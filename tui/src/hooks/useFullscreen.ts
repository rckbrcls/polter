import { useEffect } from "react";

export const ENTER_ALT_SCREEN = "\x1b[?1049h";
export const LEAVE_ALT_SCREEN = "\x1b[?1049l";
export const HIDE_CURSOR = "\x1b[?25l";
export const SHOW_CURSOR = "\x1b[?25h";

export function showCursor(): void {
  process.stdout.write(SHOW_CURSOR);
}

export function hideCursor(): void {
  process.stdout.write(HIDE_CURSOR);
}

export function useFullscreen(): void {
  useEffect(() => {
    process.stdout.write(ENTER_ALT_SCREEN + HIDE_CURSOR);

    return () => {
      process.stdout.write(SHOW_CURSOR + LEAVE_ALT_SCREEN);
    };
  }, []);
}
