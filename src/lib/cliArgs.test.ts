import { describe, expect, it } from "vitest";
import { parseCliArgs } from "./cliArgs.js";

describe("parseCliArgs", () => {
  it("parses config --edit flag", () => {
    expect(parseCliArgs(["config", "--edit"])).toEqual({
      mode: "config",
      configEdit: true,
      classic: false,
    });
  });

  it("parses config without --edit", () => {
    expect(parseCliArgs(["config"])).toEqual({
      mode: "config",
      configEdit: false,
      classic: false,
    });
  });

  it("parses mcp install (default scope)", () => {
    expect(parseCliArgs(["mcp", "install"])).toEqual({
      mode: "mcp",
      mcpAction: "install",
      mcpScope: "local",
    });
  });

  it("parses mcp update --global", () => {
    expect(parseCliArgs(["mcp", "update", "--global"])).toEqual({
      mode: "mcp",
      mcpAction: "update",
      mcpScope: "user",
    });
  });

  it("parses mcp status", () => {
    expect(parseCliArgs(["mcp", "status"])).toEqual({
      mode: "mcp",
      mcpAction: "status",
    });
  });

  it("parses mcp remove --project", () => {
    expect(parseCliArgs(["mcp", "remove", "--project"])).toEqual({
      mode: "mcp",
      mcpAction: "remove",
      mcpScope: "project",
    });
  });

  it("returns interactive for no args", () => {
    expect(parseCliArgs([])).toEqual({
      mode: "interactive",
      classic: false,
    });
  });

  it("returns help for --help", () => {
    expect(parseCliArgs(["--help"])).toEqual({
      mode: "help",
    });
  });

  it("parses pipeline run", () => {
    expect(parseCliArgs(["pipeline", "run", "my-pipeline"])).toEqual({
      mode: "pipeline-run",
      pipelineName: "my-pipeline",
    });
  });

  it("returns interactive for unknown command", () => {
    expect(parseCliArgs(["unknown"])).toEqual({
      mode: "interactive",
      classic: false,
    });
  });
});
