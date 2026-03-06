import { describe, expect, it } from "vitest";
import { parseCliArgs } from "./cliArgs.js";

describe("parseCliArgs", () => {
  it("parses app setup options", () => {
    expect(
      parseCliArgs([
        "app",
        "setup",
        "uru",
        "--path",
        "/tmp/uru",
        "--yes",
        "--create-project",
      ]),
    ).toEqual({
      mode: "app",
      options: {
        action: "setup",
        app: "uru",
        path: "/tmp/uru",
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
        "uru",
        "reset",
        "--relink",
      ]),
    ).toEqual({
      mode: "app",
      options: {
        action: "migrate",
        app: "uru",
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
        "uru",
        "--version",
        "1.2.3",
        "--install-dir",
        "/Applications",
      ]),
    ).toEqual({
      mode: "app",
      options: {
        action: "install",
        app: "uru",
        version: "1.2.3",
        installDir: "/Applications",
      },
    });
  });

  it("parses app update version overrides", () => {
    expect(
      parseCliArgs([
        "app",
        "update",
        "uru",
        "--version",
        "1.2.4",
        "--yes",
      ]),
    ).toEqual({
      mode: "app",
      options: {
        action: "update",
        app: "uru",
        version: "1.2.4",
        yes: true,
      },
    });
  });
});
