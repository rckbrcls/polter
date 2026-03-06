import { describe, expect, it } from "vitest";
import { parseCliArgs } from "./cliArgs.js";

describe("parseCliArgs", () => {
  it("parses app setup options", () => {
    expect(
      parseCliArgs([
        "app",
        "setup",
        "polterstore",
        "--path",
        "/tmp/polterstore",
        "--yes",
        "--create-project",
      ]),
    ).toEqual({
      mode: "app",
      options: {
        action: "setup",
        app: "polterstore",
        path: "/tmp/polterstore",
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
        "polterstore",
        "reset",
        "--relink",
      ]),
    ).toEqual({
      mode: "app",
      options: {
        action: "migrate",
        app: "polterstore",
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
        "polterstore",
        "--version",
        "1.2.3",
        "--install-dir",
        "/Applications",
      ]),
    ).toEqual({
      mode: "app",
      options: {
        action: "install",
        app: "polterstore",
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
        "polterstore",
        "--version",
        "1.2.4",
        "--yes",
      ]),
    ).toEqual({
      mode: "app",
      options: {
        action: "update",
        app: "polterstore",
        version: "1.2.4",
        yes: true,
      },
    });
  });
});
