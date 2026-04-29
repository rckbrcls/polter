import { beforeEach, describe, expect, it } from "vitest";
import {
  __clearPinsForTests,
  __setLegacyPinsForTests,
  getPinnedCommands,
  getPinnedRuns,
  isPinnedCommand,
  isPinnedRun,
  togglePinnedCommand,
  togglePinnedRun,
} from "./data/pins.js";

describe("pins", () => {
  beforeEach(() => {
    __clearPinsForTests();
  });

  it("togglePinnedCommand adds and removes command", () => {
    togglePinnedCommand("start");
    expect(getPinnedCommands()).toEqual(["start"]);
    expect(isPinnedCommand("start")).toBe(true);

    togglePinnedCommand("start");
    expect(getPinnedCommands()).toEqual([]);
    expect(isPinnedCommand("start")).toBe(false);
  });

  it("keeps most recent command pins first", () => {
    togglePinnedCommand("start");
    togglePinnedCommand("stop");
    expect(getPinnedCommands()).toEqual(["stop", "start"]);

    togglePinnedCommand("start"); // unpin
    togglePinnedCommand("start"); // pin again as newest
    expect(getPinnedCommands()).toEqual(["start", "stop"]);
  });

  it("togglePinnedRun adds and removes exact command runs", () => {
    togglePinnedRun("db pull --debug");
    expect(getPinnedRuns()).toEqual(["db pull --debug"]);
    expect(isPinnedRun("db pull --debug")).toBe(true);

    togglePinnedRun("db pull --debug");
    expect(getPinnedRuns()).toEqual([]);
    expect(isPinnedRun("db pull --debug")).toBe(false);
  });

  it("keeps most recent run pins first", () => {
    togglePinnedRun("db pull");
    togglePinnedRun("db pull --debug");
    expect(getPinnedRuns()).toEqual(["db pull --debug", "db pull"]);
  });

  it("keeps command pins and run pins isolated", () => {
    togglePinnedCommand("db");
    togglePinnedRun("db pull --debug");

    expect(getPinnedCommands()).toEqual(["db"]);
    expect(getPinnedRuns()).toEqual(["db pull --debug"]);
    expect(isPinnedCommand("db")).toBe(true);
    expect(isPinnedRun("db pull --debug")).toBe(true);
  });

  it("resets legacy pins model", () => {
    __setLegacyPinsForTests(["db pull"]);

    expect(getPinnedCommands()).toEqual([]);
    expect(getPinnedRuns()).toEqual([]);
    expect(isPinnedCommand("db pull")).toBe(false);
    expect(isPinnedRun("db pull")).toBe(false);
  });
});
