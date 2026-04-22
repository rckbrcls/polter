import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { execute, executeRaw } from "./execute.js";
import { bus, _resetBusForTests } from "./events.js";
import type { CommandDef } from "../data/types.js";
import {
  ToolNotFoundError,
  CommandFailedError,
  TimeoutError,
} from "./errors.js";
import type { ExecutionStartEvent, ExecutionEndEvent, ExecutionErrorEvent } from "./events.js";

// Use a command that exists on every OS
const echoCommand: CommandDef = {
  id: "test:echo",
  tool: "git", // git is universally available
  base: ["--version"],
  label: "Echo test",
};

const missingToolCommand: CommandDef = {
  id: "test:missing",
  tool: "supabase",
  base: ["status"],
  label: "Missing tool",
};

beforeEach(() => {
  _resetBusForTests();
});

afterEach(() => {
  _resetBusForTests();
});

describe("execute", () => {
  it("succeeds with correct output for a valid command", async () => {
    const result = await execute(echoCommand, [], [], process.cwd(), {
      quiet: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.exitCode).toBe(0);
      expect(result.value.stdout).toContain("git version");
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.context.tool).toBe("git");
      expect(result.context.commandId).toBe("test:echo");
    }
  });

  it("emits execution:start and execution:end events on success", async () => {
    const starts: ExecutionStartEvent[] = [];
    const ends: ExecutionEndEvent[] = [];

    bus.on("execution:start", (e) => starts.push(e));
    bus.on("execution:end", (e) => ends.push(e));

    await execute(echoCommand, [], [], process.cwd(), { quiet: true });

    expect(starts).toHaveLength(1);
    expect(starts[0].context.commandId).toBe("test:echo");

    expect(ends).toHaveLength(1);
    expect(ends[0].durationMs).toBeGreaterThanOrEqual(0);
    expect(ends[0].output.exitCode).toBe(0);
  });

  it("returns failure with CommandFailedError for non-zero exit", async () => {
    const failCmd: CommandDef = {
      id: "test:fail",
      tool: "git",
      base: ["log", "--oneline", "-1", "--no-walk", "0000000000000000000000000000000000000000"],
      label: "Fail test",
    };

    const result = await execute(failCmd, [], [], process.cwd(), {
      quiet: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(CommandFailedError);
      expect(result.error.code).toBe("COMMAND_FAILED");
    }
  });

  it("emits execution:error on failure", async () => {
    const errors: ExecutionErrorEvent[] = [];
    bus.on("execution:error", (e) => errors.push(e));

    const failCmd: CommandDef = {
      id: "test:fail2",
      tool: "git",
      base: ["log", "--oneline", "-1", "--no-walk", "0000000000000000000000000000000000000000"],
      label: "Fail test",
    };

    await execute(failCmd, [], [], process.cwd(), { quiet: true });

    expect(errors).toHaveLength(1);
    expect(errors[0].error.code).toBe("COMMAND_FAILED");
  });

  it("propagates parent context correlationId to child", async () => {
    const { createContext } = await import("./context.js");
    const parent = createContext({ tool: "git", cwd: process.cwd() });

    const result = await execute(echoCommand, [], [], process.cwd(), {
      quiet: true,
      parent,
    });

    expect(result.context.correlationId).toBe(parent.correlationId);
    expect(result.context.parentId).toBe(parent.id);
  });

  it("handles timeout by returning TimeoutError", async () => {
    // sleep 10 seconds — should be killed by the 200ms timeout
    const slowCmd: CommandDef = {
      id: "test:slow",
      tool: "git",
      base: [],
      label: "Slow test",
      timeoutMs: 200,
    };

    const result = await executeRaw("git", "sleep", ["10"], process.cwd(), {
      timeoutMs: 200,
      quiet: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(TimeoutError);
      expect(result.error.code).toBe("TIMEOUT");
    }
  }, 10000);
});

describe("executeRaw", () => {
  it("executes a raw command successfully", async () => {
    const result = await executeRaw("git", "echo", ["hello"], process.cwd(), {
      quiet: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stdout).toContain("hello");
    }
  });

  it("emits events for raw executions", async () => {
    const starts: ExecutionStartEvent[] = [];
    bus.on("execution:start", (e) => starts.push(e));

    await executeRaw("git", "echo", ["test"], process.cwd(), { quiet: true });

    expect(starts).toHaveLength(1);
    expect(starts[0].context.tool).toBe("git");
  });
});
