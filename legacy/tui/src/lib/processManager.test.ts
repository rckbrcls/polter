import { describe, it, expect, afterEach } from "vitest";
import { spawn } from "node:child_process";
import {
  startProcess,
  stopProcess,
  listProcesses,
  getProcessOutput,
  isProcessRunning,
  removeProcess,
  generateProcessId,
  findProcessesByCwd,
  findRunningByCommand,
  registerForegroundProcess,
  _resetForTests,
  createRingBuffer,
  appendToBuffer,
  tailBuffer,
} from "./processManager.js";

afterEach(() => {
  _resetForTests();
});

describe("RingBuffer", () => {
  it("appends lines and respects capacity", () => {
    const buf = createRingBuffer(5);
    appendToBuffer(buf, "a\nb\nc\nd\ne\nf\ng\n");
    expect(buf.lines).toEqual(["c", "d", "e", "f", "g"]);
    expect(buf.totalLines).toBe(7);
  });

  it("handles data without trailing newline", () => {
    const buf = createRingBuffer(10);
    appendToBuffer(buf, "hello\nworld");
    expect(buf.lines).toEqual(["hello", "world"]);
  });

  it("tail returns last N lines", () => {
    const buf = createRingBuffer(10);
    appendToBuffer(buf, "a\nb\nc\nd\ne\n");
    expect(tailBuffer(buf, 3)).toEqual(["c", "d", "e"]);
    expect(tailBuffer(buf)).toEqual(["a", "b", "c", "d", "e"]);
  });
});

describe("generateProcessId", () => {
  it("slugifies command and args", () => {
    expect(generateProcessId("npm", ["run", "dev"])).toBe("npm-run-dev");
  });

  it("strips special characters", () => {
    expect(generateProcessId("node", ["./src/index.ts"])).toBe("node-src-index-ts");
  });

  it("deduplicates with suffix", () => {
    startProcess("npm-run-dev", "echo", ["hello"]);
    const id = generateProcessId("npm", ["run", "dev"]);
    expect(id).toBe("npm-run-dev-2");
  });
});

describe("startProcess / listProcesses", () => {
  it("starts a process and lists it", async () => {
    const info = startProcess("test-echo", "echo", ["hello"]);
    expect(info.id).toBe("test-echo");
    expect(info.status).toBe("running");
    expect(typeof info.pid).toBe("number");

    const list = listProcesses();
    expect(list.some((p) => p.id === "test-echo")).toBe(true);

    // Wait for it to exit
    await new Promise((r) => setTimeout(r, 500));
  });

  it("rejects duplicate ID while running", () => {
    startProcess("dup-test", "sleep", ["10"]);
    expect(() => startProcess("dup-test", "echo", ["hi"])).toThrow(
      /already running/,
    );
  });

  it("allows ID reuse after process exits", async () => {
    startProcess("reuse-test", "echo", ["done"]);
    // Wait for echo to exit
    await new Promise((r) => setTimeout(r, 500));
    // Should not throw
    const info = startProcess("reuse-test", "echo", ["again"]);
    expect(info.id).toBe("reuse-test");
    await new Promise((r) => setTimeout(r, 500));
  });
});

describe("getProcessOutput", () => {
  it("captures stdout from a process", async () => {
    startProcess("out-test", "echo", ["-e", "line1\\nline2\\nline3"]);
    await new Promise((r) => setTimeout(r, 500));

    const output = getProcessOutput("out-test");
    expect(output.stdoutLineCount).toBeGreaterThan(0);
    const joined = output.stdout.join("\n");
    expect(joined).toContain("line1");
  });

  it("supports tail parameter", async () => {
    startProcess("tail-test", "echo", ["-e", "a\\nb\\nc\\nd\\ne"]);
    await new Promise((r) => setTimeout(r, 500));

    const output = getProcessOutput("tail-test", 2);
    expect(output.stdout.length).toBeLessThanOrEqual(2);
  });

  it("throws for unknown id", () => {
    expect(() => getProcessOutput("nope")).toThrow(/No tracked process/);
  });
});

describe("stopProcess", () => {
  it("stops a running process", async () => {
    startProcess("stop-test", "sleep", ["60"]);
    expect(isProcessRunning("stop-test")).toBe(true);

    const info = await stopProcess("stop-test");
    expect(info.status).not.toBe("running");
    expect(isProcessRunning("stop-test")).toBe(false);
  });
});

describe("isProcessRunning", () => {
  it("returns false for unknown id", () => {
    expect(isProcessRunning("unknown")).toBe(false);
  });

  it("returns true for running, false after exit", async () => {
    startProcess("alive-test", "sleep", ["60"]);
    expect(isProcessRunning("alive-test")).toBe(true);
    await stopProcess("alive-test");
    expect(isProcessRunning("alive-test")).toBe(false);
  });
});

describe("removeProcess", () => {
  it("removes an exited process", async () => {
    startProcess("rm-test", "echo", ["bye"]);
    await new Promise((r) => setTimeout(r, 500));
    removeProcess("rm-test");
    expect(listProcesses().some((p) => p.id === "rm-test")).toBe(false);
  });

  it("throws when removing a running process", () => {
    startProcess("rm-run", "sleep", ["60"]);
    expect(() => removeProcess("rm-run")).toThrow(/Stop it first/);
  });
});

describe("findProcessesByCwd", () => {
  it("filters processes by cwd", () => {
    startProcess("cwd-a1", "sleep", ["60"], "/tmp/test-a");
    startProcess("cwd-a2", "sleep", ["61"], "/tmp/test-a");
    startProcess("cwd-b1", "sleep", ["62"], "/tmp/test-b");

    const result = findProcessesByCwd("/tmp/test-a");
    expect(result.length).toBe(2);
    expect(result.every((p) => p.cwd === "/tmp/test-a")).toBe(true);
  });

  it("normalizes trailing slash", () => {
    startProcess("cwd-slash", "sleep", ["60"], "/tmp/test-slash");

    const result = findProcessesByCwd("/tmp/test-slash/");
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("cwd-slash");
  });
});

describe("findRunningByCommand", () => {
  it("finds a running process by command and args", () => {
    startProcess("find-cmd", "echo", ["hello", "world"], "/tmp/test-c");

    const found = findRunningByCommand("/tmp/test-c", "echo", ["hello", "world"]);
    expect(found).toBeDefined();
    expect(found!.id).toBe("find-cmd");
  });

  it("returns undefined for different args", () => {
    startProcess("find-diff", "echo", ["hello"], "/tmp/test-d");

    const found = findRunningByCommand("/tmp/test-d", "echo", ["goodbye"]);
    expect(found).toBeUndefined();
  });

  it("returns undefined after process exits", async () => {
    startProcess("find-exit", "echo", ["done"], "/tmp/test-e");
    await new Promise((r) => setTimeout(r, 500));

    const found = findRunningByCommand("/tmp/test-e", "echo", ["done"]);
    expect(found).toBeUndefined();
  });
});

describe("registerForegroundProcess", () => {
  it("registers an externally-spawned child and captures output", async () => {
    const child = spawn("echo", ["-e", "fg-line1\\nfg-line2"], {
      shell: true,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const info = registerForegroundProcess("fg-test", "echo", ["-e", "fg-line1\\nfg-line2"], process.cwd(), child);
    expect(info.id).toBe("fg-test");
    expect(info.status).toBe("running");

    const list = listProcesses();
    expect(list.some((p) => p.id === "fg-test")).toBe(true);

    await new Promise((r) => setTimeout(r, 500));

    const output = getProcessOutput("fg-test");
    expect(output.stdoutLineCount).toBeGreaterThan(0);
    const joined = output.stdout.join("\n");
    expect(joined).toContain("fg-line1");
  });

  it("marks process as exited after child exits", async () => {
    const child = spawn("echo", ["done"], {
      shell: true,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    registerForegroundProcess("fg-exit", "echo", ["done"], process.cwd(), child);
    await new Promise((r) => setTimeout(r, 500));

    const list = listProcesses();
    const proc = list.find((p) => p.id === "fg-exit");
    expect(proc).toBeDefined();
    expect(proc!.status).toBe("exited");
    expect(proc!.exitCode).toBe(0);
  });

  it("rejects duplicate running ID", () => {
    const child1 = spawn("sleep", ["60"], { shell: true, detached: true, stdio: ["ignore", "pipe", "pipe"] });
    registerForegroundProcess("fg-dup", "sleep", ["60"], process.cwd(), child1);

    const child2 = spawn("echo", ["hi"], { shell: true, detached: true, stdio: ["ignore", "pipe", "pipe"] });
    expect(() => registerForegroundProcess("fg-dup", "echo", ["hi"], process.cwd(), child2)).toThrow(/already running/);

    // Clean up child2 since it won't be tracked
    if (child2.pid) try { process.kill(-child2.pid, "SIGKILL"); } catch { /* ignore */ }
  });
});
