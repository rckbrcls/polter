import { describe, it, expect } from "vitest";
import { parseErrorSuggestions } from "./errorSuggestions.js";

describe("parseErrorSuggestions", () => {
  it("parses backtick commands with 'run'", () => {
    const stderr = 'Error: not linked. Try running `supabase link --project-ref abc`';
    const result = parseErrorSuggestions("", stderr, "supabase");
    expect(result).toEqual([
      {
        tool: "supabase",
        args: ["link", "--project-ref", "abc"],
        display: "supabase link --project-ref abc",
      },
    ]);
  });

  it("parses backtick commands with 'use'", () => {
    const stderr = "Please use `gh auth login` to authenticate.";
    const result = parseErrorSuggestions("", stderr, "gh");
    expect(result).toEqual([
      {
        tool: "gh",
        args: ["auth", "login"],
        display: "gh auth login",
      },
    ]);
  });

  it("parses 'Have you run' suggestions", () => {
    const stderr =
      "Cannot find project ref. Have you run supabase link?\nTry rerunning the command with --debug to troubleshoot the error.";
    const result = parseErrorSuggestions("", stderr, "supabase");
    expect(result).toHaveLength(1);
    expect(result[0]!.display).toBe("supabase link");
  });

  it("parses 'did you mean' suggestions", () => {
    const stderr = 'Unknown command "db". Did you mean: db push?';
    const result = parseErrorSuggestions("", stderr, "supabase");
    expect(result).toEqual([
      {
        tool: "supabase",
        args: ["db", "push"],
        display: "supabase db push",
      },
    ]);
  });

  it("parses indented tool commands", () => {
    const stderr = "Available commands:\n    supabase db reset\n    supabase db push\n";
    const result = parseErrorSuggestions("", stderr, "supabase");
    expect(result).toHaveLength(2);
    expect(result[0]!.display).toBe("supabase db reset");
    expect(result[1]!.display).toBe("supabase db push");
  });

  it("parses arrow/bullet suggestions", () => {
    const stderr = "Try one of:\n  - run: supabase link\n  → vercel login\n";
    const result = parseErrorSuggestions("", stderr, "supabase");
    expect(result).toHaveLength(2);
    expect(result[0]!.display).toBe("supabase link");
    expect(result[1]!.display).toBe("vercel login");
    expect(result[1]!.tool).toBe("vercel");
  });

  it("deduplicates suggestions", () => {
    const stderr =
      'Try running `supabase link`\nOr run `supabase link`\n    supabase link\n';
    const result = parseErrorSuggestions("", stderr, "supabase");
    expect(result).toHaveLength(1);
    expect(result[0]!.display).toBe("supabase link");
  });

  it("returns empty array when no suggestions found", () => {
    const result = parseErrorSuggestions("some output", "some error", "supabase");
    expect(result).toEqual([]);
  });

  it("caps at 3 suggestions", () => {
    const stderr = [
      "  - supabase link",
      "  - supabase db push",
      "  - supabase db pull",
      "  - supabase db reset",
    ].join("\n");
    const result = parseErrorSuggestions("", stderr, "supabase");
    expect(result).toHaveLength(3);
  });

  it("strips ANSI codes before parsing", () => {
    const stderr =
      'Error: not linked. Try running `\u001B[1msupabase link\u001B[0m`';
    const result = parseErrorSuggestions("", stderr, "supabase");
    expect(result).toHaveLength(1);
    expect(result[0]!.display).toBe("supabase link");
  });

  it("detects tool prefix from command", () => {
    const stderr = 'Try running `gh auth login`';
    const result = parseErrorSuggestions("", stderr, "supabase");
    expect(result[0]!.tool).toBe("gh");
  });

  it("uses currentTool as fallback when no known tool prefix", () => {
    const stderr = 'Did you mean: db push?';
    const result = parseErrorSuggestions("", stderr, "supabase");
    expect(result[0]!.tool).toBe("supabase");
  });

  it("parses suggestions from stdout as well", () => {
    const stdout = 'Try running `supabase login`';
    const result = parseErrorSuggestions(stdout, "", "supabase");
    expect(result).toHaveLength(1);
    expect(result[0]!.display).toBe("supabase login");
  });
});
