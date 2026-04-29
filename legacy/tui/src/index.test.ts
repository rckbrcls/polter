import { describe, it, expect } from "vitest";
import {
  categories,
  getCategoryOptions,
  getCommandOptions,
} from "./data/commands.js";
import { globalFlags } from "./data/flags.js";

describe("commands", () => {
  it("should have no empty categories", () => {
    for (const [key, cat] of Object.entries(categories)) {
      expect(cat.commands.length, `Category "${key}" is empty`).toBeGreaterThan(
        0,
      );
    }
  });

  it("should keep categories small (max 7 items)", () => {
    for (const [key, cat] of Object.entries(categories)) {
      expect(
        cat.commands.length,
        `Category "${key}" has ${cat.commands.length} items, max 7`,
      ).toBeLessThanOrEqual(7);
    }
  });

  it("should have no duplicate command values across all categories", () => {
    const allValues: string[] = [];
    for (const cat of Object.values(categories)) {
      for (const cmd of cat.commands) {
        expect(allValues, `Duplicate command: ${cmd.value}`).not.toContain(
          cmd.value,
        );
        allValues.push(cmd.value);
      }
    }
  });

  it("getCategoryOptions returns correct length", () => {
    const opts = getCategoryOptions();
    expect(opts.length).toBe(Object.keys(categories).length);
  });

  it("getCommandOptions returns commands for valid key", () => {
    const opts = getCommandOptions("local-dev");
    expect(opts.length).toBeGreaterThan(0);
    expect(opts[0]).toHaveProperty("value");
    expect(opts[0]).toHaveProperty("label");
  });

  it("getCommandOptions returns empty for invalid key", () => {
    const opts = getCommandOptions("nonexistent");
    expect(opts).toEqual([]);
  });
});

describe("globalFlags", () => {
  it("should include --debug flag", () => {
    expect(globalFlags.some((f) => f.value === "--debug")).toBe(true);
  });

  it("should have value and label for all flags", () => {
    for (const flag of globalFlags) {
      expect(flag.value).toBeTruthy();
      expect(flag.label).toBeTruthy();
    }
  });
});
