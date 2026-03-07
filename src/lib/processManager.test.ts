import { describe, it, expect, afterEach } from "vitest";
import {
  startProcess,
  stopProcess,
  listProcesses,
  getProcessOutput,
  isProcessRunning,
  removeProcess,
  generateProcessId,
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
