import { describe, expect, it } from "vitest";
import {
  PolterError,
  ToolNotFoundError,
  CommandFailedError,
  TimeoutError,
  SpawnError,
  PermissionDeniedError,
  PipelineStepFailedError,
  ErrorCode,
} from "./errors.js";

describe("PolterError", () => {
  it("constructs with code, category, and context", () => {
    const err = new PolterError("boom", ErrorCode.COMMAND_FAILED, "retryable", {
      foo: "bar",
    });

    expect(err.message).toBe("boom");
    expect(err.code).toBe("COMMAND_FAILED");
    expect(err.category).toBe("retryable");
    expect(err.context).toEqual({ foo: "bar" });
    expect(err.name).toBe("PolterError");
    expect(err).toBeInstanceOf(Error);
  });

  it("isRetryable reflects category", () => {
    const retryable = new PolterError("r", ErrorCode.TIMEOUT, "retryable");
    const permanent = new PolterError("p", ErrorCode.TOOL_NOT_FOUND, "permanent");

    expect(retryable.isRetryable).toBe(true);
    expect(permanent.isRetryable).toBe(false);
  });

  it("serializes to JSON without the stack", () => {
    const err = new PolterError("test", ErrorCode.SPAWN_ERROR, "permanent", {
      pid: 123,
    });
    const json = err.toJSON();

    expect(json).toEqual({
      name: "PolterError",
      message: "test",
      code: "SPAWN_ERROR",
      category: "permanent",
      context: { pid: 123 },
    });
  });
});

describe("ToolNotFoundError", () => {
  it("is permanent with correct code", () => {
    const err = new ToolNotFoundError("supabase");

    expect(err.code).toBe("TOOL_NOT_FOUND");
    expect(err.category).toBe("permanent");
    expect(err.context.tool).toBe("supabase");
    expect(err.name).toBe("ToolNotFoundError");
    expect(err).toBeInstanceOf(PolterError);
  });
});

describe("CommandFailedError", () => {
  it("classifies transient exit codes as retryable", () => {
    // 137 = SIGKILL
    const err = new CommandFailedError("supabase:db:push", 137, "SIGKILL", "killed");
    expect(err.category).toBe("retryable");
    expect(err.exitCode).toBe(137);
    expect(err.signal).toBe("SIGKILL");
  });

  it("classifies normal exit codes as permanent", () => {
    const err = new CommandFailedError("git:push", 1, null, "rejected");
    expect(err.category).toBe("permanent");
  });

  it("truncates stderr to 2000 chars in context", () => {
    const longStderr = "x".repeat(3000);
    const err = new CommandFailedError("cmd", 1, null, longStderr);
    expect((err.context.stderr as string).length).toBe(2000);
  });

  it("classifies null exit code (killed before exit) as retryable", () => {
    const err = new CommandFailedError("cmd", null, "SIGTERM", "");
    expect(err.category).toBe("retryable");
  });
});

describe("TimeoutError", () => {
  it("is always retryable", () => {
    const err = new TimeoutError("vercel:deploy", 30000);
    expect(err.code).toBe("TIMEOUT");
    expect(err.category).toBe("retryable");
    expect(err.context.timeoutMs).toBe(30000);
  });
});

describe("SpawnError", () => {
  it("classifies ENOENT as permanent", () => {
    const err = new SpawnError("supabase", "spawn supabase ENOENT");
    expect(err.category).toBe("permanent");
  });

  it("classifies other spawn errors as retryable", () => {
    const err = new SpawnError("gh", "EPERM: operation not permitted");
    expect(err.category).toBe("retryable");
  });
});

describe("PermissionDeniedError", () => {
  it("has permission category", () => {
    const err = new PermissionDeniedError("git:push", "destructive in agent mode");
    expect(err.code).toBe("PERMISSION_DENIED");
    expect(err.category).toBe("permission");
  });
});

describe("PipelineStepFailedError", () => {
  it("inherits category from underlying error", () => {
    const cause = new TimeoutError("cmd", 5000);
    const err = new PipelineStepFailedError("deploy", 2, "Deploy", cause);

    expect(err.code).toBe("PIPELINE_STEP_FAILED");
    expect(err.category).toBe("retryable"); // inherited from TimeoutError
    expect(err.cause).toBe(cause);
  });

  it("defaults to permanent for non-PolterError causes", () => {
    const cause = new Error("unknown");
    const err = new PipelineStepFailedError("deploy", 0, "Init", cause);

    expect(err.category).toBe("permanent");
  });
});
