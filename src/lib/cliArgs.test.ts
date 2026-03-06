import { describe, expect, it } from "vitest";
import { parseCliArgs } from "./cliArgs.js";

describe("parseCliArgs", () => {
  it("parses app setup options", () => {
    expect(
      parseCliArgs([
        "app",
        "setup",
        "ops",
        "--path",
        "/tmp/ops",
        "--yes",
        "--create-project",
      ]),
    ).toEqual({
      mode: "app",
      options: {
        action: "setup",
        app: "ops",
        path: "/tmp/ops",
        yes: true,
        createProject: true,
      },
    });
  });

  it("parses app migrate subcommands", () => {
    expect(
      parseCliArgs([
        "app",
        "migrate",
        "ops",
        "reset",
        "--relink",
      ]),
    ).toEqual({
      mode: "app",
      options: {
        action: "migrate",
        app: "ops",
        migrationAction: "reset",
        relink: true,
      },
    });
  });

  it("parses app install version overrides", () => {
    expect(
      parseCliArgs([
        "app",
        "install",
        "ops",
        "--version",
        "1.2.3",
        "--install-dir",
        "/Applications",
      ]),
    ).toEqual({
      mode: "app",
      options: {
        action: "install",
        app: "ops",
        version: "1.2.3",
        installDir: "/Applications",
      },
    });
  });

  it("parses config --edit flag", () => {
    expect(parseCliArgs(["config", "--edit"])).toEqual({
      mode: "config",
      options: {},
      configEdit: true,
      classic: false,
    });
  });

  it("parses config without --edit", () => {
    expect(parseCliArgs(["config"])).toEqual({
      mode: "config",
      options: {},
      configEdit: false,
      classic: false,
    });
  });

  it("parses mcp install (default scope)", () => {
    expect(parseCliArgs(["mcp", "install"])).toEqual({
      mode: "mcp",
      options: {},
      mcpAction: "install",
      mcpScope: "local",
    });
  });

  it("parses mcp update --global", () => {
    expect(parseCliArgs(["mcp", "update", "--global"])).toEqual({
      mode: "mcp",
      options: {},
      mcpAction: "update",
      mcpScope: "user",
    });
  });

  it("parses mcp status", () => {
    expect(parseCliArgs(["mcp", "status"])).toEqual({
      mode: "mcp",
      options: {},
      mcpAction: "status",
    });
  });

  it("parses mcp remove --project", () => {
    expect(parseCliArgs(["mcp", "remove", "--project"])).toEqual({
      mode: "mcp",
      options: {},
      mcpAction: "remove",
      mcpScope: "project",
    });
  });

  it("parses app update version overrides", () => {
    expect(
      parseCliArgs([
        "app",
        "update",
        "ops",
        "--version",
        "1.2.4",
        "--yes",
      ]),
    ).toEqual({
      mode: "app",
      options: {
        action: "update",
        app: "ops",
        version: "1.2.4",
        yes: true,
      },
    });
  });
});
