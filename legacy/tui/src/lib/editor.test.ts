import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { resolveEditor, isTerminalEditor } from "./editor.js";

describe("resolveEditor", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env["VISUAL"];
    delete process.env["EDITOR"];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses $VISUAL when set", () => {
    process.env["VISUAL"] = "code";
    expect(resolveEditor()).toEqual({ command: "code", args: [] });
  });

  it("falls back to $EDITOR when $VISUAL is not set", () => {
    process.env["EDITOR"] = "nvim";
    expect(resolveEditor()).toEqual({ command: "nvim", args: [] });
  });

  it("prefers $VISUAL over $EDITOR", () => {
    process.env["VISUAL"] = "code";
    process.env["EDITOR"] = "nvim";
    expect(resolveEditor()).toEqual({ command: "code", args: [] });
  });

  it("splits command and arguments", () => {
    process.env["EDITOR"] = "nvim --clean --noplugin";
    expect(resolveEditor()).toEqual({
      command: "nvim",
      args: ["--clean", "--noplugin"],
    });
  });

  it("returns fallback when no env vars set", () => {
    const result = resolveEditor();
    // macOS/Linux → nano, Windows → notepad
    expect(["nano", "notepad"]).toContain(result.command);
    expect(result.args).toEqual([]);
  });
});

describe("isTerminalEditor", () => {
  it("identifies terminal editors", () => {
    expect(isTerminalEditor("nvim")).toBe(true);
    expect(isTerminalEditor("vim")).toBe(true);
    expect(isTerminalEditor("nano")).toBe(true);
    expect(isTerminalEditor("emacs")).toBe(true);
    expect(isTerminalEditor("micro")).toBe(true);
    expect(isTerminalEditor("helix")).toBe(true);
    expect(isTerminalEditor("hx")).toBe(true);
  });

  it("identifies GUI editors", () => {
    expect(isTerminalEditor("code")).toBe(false);
    expect(isTerminalEditor("subl")).toBe(false);
    expect(isTerminalEditor("atom")).toBe(false);
  });

  it("handles full paths", () => {
    expect(isTerminalEditor("/usr/bin/nvim")).toBe(true);
    expect(isTerminalEditor("/usr/local/bin/code")).toBe(false);
  });
});
