import { createRequire } from "node:module";
import figures from "figures";
import pc from "picocolors";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as { version: string };
const SUPABASE_HEX = "#3ECF8E";
const SUPABASE_FG = "\u001b[38;2;62;207;142m";
const SUPABASE_BG = "\u001b[48;2;62;207;142m";
const RESET_FG = "\u001b[39m";
const RESET_BG = "\u001b[49m";

const wrapAnsi =
  (open: string, close: string) =>
  (input: string): string =>
    pc.isColorSupported ? `${open}${input}${close}` : input;

const supabase = wrapAnsi(SUPABASE_FG, RESET_FG);
const supabaseBg = wrapAnsi(SUPABASE_BG, RESET_BG);

export const VERSION = packageJson.version;
export const inkColors = {
  accent: SUPABASE_HEX,
  accentContrast: "#081116",
} as const;

export const colors = {
  primary: supabase,
  primaryBold: (s: string) => pc.bold(supabase(s)),
  accent: supabase,
  accentBold: (s: string) => pc.bold(supabase(s)),
  success: supabase,
  successBold: (s: string) => pc.bold(supabase(s)),
  error: pc.red,
  errorBold: (s: string) => pc.bold(pc.red(s)),
  warning: supabase,
  warningBold: (s: string) => pc.bold(supabase(s)),
  dim: pc.dim,
  bold: pc.bold,
  white: pc.white,
  highlight: (s: string) => supabaseBg(pc.black(pc.bold(s))),
};

export const symbols = {
  pointer: figures.pointer,
  pointerActive: figures.pointer,
  check: figures.tick,
  cross: figures.cross,
  bullet: figures.bullet,
  bulletEmpty: figures.circle,
  pin: "📌",
  ghost: "👻",
  exit: "🚪",
  edit: "✏️",
  gear: "⚙️",
  back: figures.arrowLeft,
  arrowRight: figures.arrowRight,
  separator: "─",
  cornerTL: "╭",
  cornerTR: "╮",
  cornerBL: "╰",
  cornerBR: "╯",
  vertical: "│",
  horizontal: "─",
};

export const panel = {
  borderFocused: SUPABASE_HEX,
  borderDim: "#555555",
  sidebarWidth: (termWidth: number) =>
    Math.max(20, Math.min(35, Math.floor(termWidth * 0.3))),
} as const;

export const ghost = {
  art: [
    "    ▄▄████████████▄▄",
    "   █                █",
    "  █   ▄██▄     ▂█▂   █",
    "  █   ▀██▀     ▔█▔   █",
    "  █                  █",
    "  █   ██ ██████ ██   █",
    "  █                  █",
    "  █▄██▀▀██▄▄▄▄██▀▀██▄█",
  ],
};
