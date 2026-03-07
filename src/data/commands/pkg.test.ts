import { describe, expect, it } from "vitest";
import { pkgCommands } from "./pkg.js";

describe("pkgCommands", () => {
  it("all commands have unique IDs", () => {
    const ids = pkgCommands.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all commands have tool === 'pkg'", () => {
    for (const cmd of pkgCommands) {
      expect(cmd.tool).toBe("pkg");
    }
  });

  it("all commands have non-empty base, label, and hint", () => {
    for (const cmd of pkgCommands) {
      expect(cmd.base.length).toBeGreaterThan(0);
      expect(cmd.label.length).toBeGreaterThan(0);
      expect(cmd.hint?.length).toBeGreaterThan(0);
    }
  });

  it("all command IDs start with pkg:", () => {
    for (const cmd of pkgCommands) {
      expect(cmd.id.startsWith("pkg:")).toBe(true);
    }
  });

  it("has expected number of commands", () => {
    expect(pkgCommands.length).toBe(21);
  });
});
