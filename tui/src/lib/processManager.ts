import type { ChildProcess } from "node:child_process";
import { join } from "node:path";
import { execa } from "execa";
import ms from "ms";
import { onExit } from "signal-exit";
import { findNearestPackageRoot } from "./packageRoot.js";
import { processEvents } from "./processEvents.js";

// --- Types ---

export interface ProcessInfo {
  id: string;
  command: string;
  args: string[];
  cwd: string;
  pid: number | undefined;
  status: "running" | "exited" | "errored";
  exitCode: number | null;
  signal: string | null;
  startedAt: string;
  exitedAt: string | null;
  uptime: number;
}

export interface ProcessOutput {
  stdout: string[];
  stderr: string[];
  stdoutLineCount: number;
  stderrLineCount: number;
}

// --- Ring Buffer ---

const DEFAULT_BUFFER_CAP = 1000;

interface RingBuffer {
  lines: string[];
  cap: number;
  totalLines: number;
}

function createRingBuffer(cap = DEFAULT_BUFFER_CAP): RingBuffer {
  return { lines: [], cap, totalLines: 0 };
}

function appendToBuffer(buf: RingBuffer, data: string): void {
  const newLines = data.split("\n");
  // Last element is either empty (if data ended with \n) or a partial line.
  // We keep partial lines to avoid losing data — they'll be completed by the next chunk.
  if (newLines.length > 0 && newLines[newLines.length - 1] === "") {
    newLines.pop();
  }
  if (newLines.length === 0) return;

  buf.lines.push(...newLines);
  buf.totalLines += newLines.length;

  if (buf.lines.length > buf.cap) {
    buf.lines.splice(0, buf.lines.length - buf.cap);
  }
}

function tailBuffer(buf: RingBuffer, n?: number): string[] {
  if (n === undefined || n >= buf.lines.length) return [...buf.lines];
  return buf.lines.slice(-n);
}

// --- Internal State ---

interface TrackedProcess {
  id: string;
  command: string;
  args: string[];
  cwd: string;
  child: ChildProcess;
  status: "running" | "exited" | "errored";
  exitCode: number | null;
  signal: string | null;
  startedAt: Date;
  exitedAt: Date | null;
  stdout: RingBuffer;
  stderr: RingBuffer;
}

const registry = new Map<string, TrackedProcess>();
let cleanupRegistered = false;

function registerCleanup(): void {
  if (cleanupRegistered) return;
  cleanupRegistered = true;

  onExit(() => {
    for (const proc of registry.values()) {
      if (proc.status === "running" && proc.child.pid) {
        try {
          process.kill(-proc.child.pid, "SIGKILL");
        } catch {
          // Process may already be gone
        }
      }
    }
  }, { alwaysLast: true });
}

// --- Public API ---

export function generateProcessId(command: string, args: string[]): string {
  const slug = [command, ...args]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  if (!registry.has(slug)) return slug;

  let i = 2;
  while (registry.has(`${slug}-${i}`)) i++;
  return `${slug}-${i}`;
}

function trackChild(
  id: string,
  command: string,
  args: string[],
  cwd: string,
  child: ChildProcess,
): ProcessInfo {
  const existing = registry.get(id);
  if (existing && existing.status === "running") {
    throw new Error(`Process "${id}" is already running (pid ${existing.child.pid})`);
  }

  registerCleanup();

  const tracked: TrackedProcess = {
    id,
    command,
    args,
    cwd,
    child,
    status: "running",
    exitCode: null,
    signal: null,
    startedAt: new Date(),
    exitedAt: null,
    stdout: createRingBuffer(),
    stderr: createRingBuffer(),
  };

  child.stdout?.on("data", (data: Buffer) => {
    const text = data.toString();
    appendToBuffer(tracked.stdout, text);
    processEvents.emit("output", id, "stdout", text);
  });

  child.stderr?.on("data", (data: Buffer) => {
    const text = data.toString();
    appendToBuffer(tracked.stderr, text);
    processEvents.emit("output", id, "stderr", text);
  });

  child.on("exit", (code, signal) => {
    tracked.status = "exited";
    tracked.exitCode = code;
    tracked.signal = signal;
    tracked.exitedAt = new Date();
    processEvents.emit("stopped", toProcessInfo(tracked));
  });

  child.on("error", (err) => {
    tracked.status = "errored";
    tracked.exitedAt = new Date();
    appendToBuffer(tracked.stderr, `spawn error: ${err.message}\n`);
    processEvents.emit("errored", toProcessInfo(tracked), err.message);
  });

  registry.set(id, tracked);

  const info = toProcessInfo(tracked);
  processEvents.emit("started", info);
  return info;
}

export function startProcess(
  id: string,
  command: string,
  args: string[] = [],
  cwd: string = process.cwd(),
  env?: NodeJS.ProcessEnv,
): ProcessInfo {
  const subprocess = execa(command, args, {
    cwd,
    env: env ?? process.env,
    detached: true,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
    shell: true,
    reject: false,
  });

  return trackChild(id, command, args, cwd, subprocess as unknown as ChildProcess);
}

export function registerForegroundProcess(
  id: string,
  command: string,
  args: string[],
  cwd: string,
  child: ChildProcess | { pid?: number; stdout: NodeJS.ReadableStream | null; stderr: NodeJS.ReadableStream | null; on: ChildProcess["on"]; once: ChildProcess["once"]; removeListener: ChildProcess["removeListener"] },
): ProcessInfo {
  return trackChild(id, command, args, cwd, child as ChildProcess);
}

export function stopProcess(id: string): Promise<ProcessInfo> {
  const proc = registry.get(id);
  if (!proc) throw new Error(`No tracked process with id "${id}"`);
  if (proc.status !== "running") return Promise.resolve(toProcessInfo(proc));

  return new Promise((resolve) => {
    const escalateTimer = setTimeout(() => {
      if (proc.status === "running" && proc.child.pid) {
        try { process.kill(-proc.child.pid, "SIGKILL"); } catch { /* already gone */ }
      }
    }, ms("5s"));

    const onDone = () => {
      clearTimeout(escalateTimer);
      resolve(toProcessInfo(proc));
    };

    proc.child.once("exit", onDone);

    if (proc.child.pid) {
      try { process.kill(-proc.child.pid, "SIGTERM"); } catch { /* already gone */ }
    }

    // If already exited between our check and the listener
    if (proc.status !== "running") {
      clearTimeout(escalateTimer);
      proc.child.removeListener("exit", onDone);
      resolve(toProcessInfo(proc));
    }
  });
}

export function listProcesses(): ProcessInfo[] {
  return Array.from(registry.values()).map(toProcessInfo).reverse();
}

export function getProcessOutput(id: string, tail?: number, stream?: "stdout" | "stderr" | "both"): ProcessOutput {
  const proc = registry.get(id);
  if (!proc) throw new Error(`No tracked process with id "${id}"`);

  const which = stream ?? "both";
  return {
    stdout: which === "stderr" ? [] : tailBuffer(proc.stdout, tail),
    stderr: which === "stdout" ? [] : tailBuffer(proc.stderr, tail),
    stdoutLineCount: proc.stdout.totalLines,
    stderrLineCount: proc.stderr.totalLines,
  };
}

export function isProcessRunning(id: string): boolean {
  const proc = registry.get(id);
  if (!proc) return false;
  if (proc.status !== "running") return false;

  // Verify PID is actually alive
  if (proc.child.pid) {
    try {
      process.kill(proc.child.pid, 0);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function removeProcess(id: string): void {
  const proc = registry.get(id);
  if (!proc) throw new Error(`No tracked process with id "${id}"`);
  if (proc.status === "running") {
    throw new Error(`Cannot remove running process "${id}". Stop it first.`);
  }
  registry.delete(id);
}

export function findProcessesByCwd(cwd: string): ProcessInfo[] {
  const normalized = cwd.replace(/\/+$/, "");
  return Array.from(registry.values())
    .filter((proc) => proc.cwd.replace(/\/+$/, "") === normalized)
    .map(toProcessInfo);
}

export function findRunningByCommand(cwd: string, command: string, args: string[]): ProcessInfo | undefined {
  const normalized = cwd.replace(/\/+$/, "");
  const argsStr = args.join(" ");
  for (const proc of registry.values()) {
    if (
      proc.cwd.replace(/\/+$/, "") === normalized &&
      proc.status === "running" &&
      proc.command === command &&
      proc.args.join(" ") === argsStr
    ) {
      return toProcessInfo(proc);
    }
  }
  return undefined;
}

// --- Helpers ---

function toProcessInfo(proc: TrackedProcess): ProcessInfo {
  const now = Date.now();
  const start = proc.startedAt.getTime();
  const end = proc.exitedAt ? proc.exitedAt.getTime() : now;

  return {
    id: proc.id,
    command: proc.command,
    args: proc.args,
    cwd: proc.cwd,
    pid: proc.child.pid,
    status: proc.status,
    exitCode: proc.exitCode,
    signal: proc.signal,
    startedAt: proc.startedAt.toISOString(),
    exitedAt: proc.exitedAt?.toISOString() ?? null,
    uptime: end - start,
  };
}

// --- Test Helpers (not exported from api.ts) ---

export function _resetForTests(): void {
  for (const proc of registry.values()) {
    if (proc.status === "running" && proc.child.pid) {
      try { process.kill(-proc.child.pid, "SIGKILL"); } catch { /* ignore */ }
    }
  }
  registry.clear();
}

export function getSocketPath(cwd?: string): string | undefined {
  const root = findNearestPackageRoot(cwd);
  if (!root) return undefined;
  return join(root, ".polter", "polter.sock");
}

export { createRingBuffer, appendToBuffer, tailBuffer, type RingBuffer };
