import { describe, it, expect, afterEach } from "vitest";
import { join } from "node:path";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { createIpcServer } from "./ipcServer.js";
import { createIpcClient } from "./ipcClient.js";

function tempSocketPath(): { dir: string; path: string } {
  const dir = mkdtempSync(join(tmpdir(), "polter-ipc-test-"));
  return { dir, path: join(dir, "test.sock") };
}

const cleanups: (() => Promise<void> | void)[] = [];

afterEach(async () => {
  for (const fn of cleanups.reverse()) {
    await fn();
  }
  cleanups.length = 0;
});

describe("IPC server + client", () => {
  it("handles status RPC call", async () => {
    const { dir, path } = tempSocketPath();
    const server = createIpcServer(path);
    await server.start();
    cleanups.push(() => server.stop());
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));

    expect(existsSync(path)).toBe(true);

    const client = createIpcClient(path);
    await client.connect();
    cleanups.push(() => client.disconnect());

    const result = await client.call("status") as { tui: boolean; pid: number };
    expect(result.tui).toBe(true);
    expect(typeof result.pid).toBe("number");
  });

  it("returns ps.list (empty initially)", async () => {
    const { dir, path } = tempSocketPath();
    const server = createIpcServer(path);
    await server.start();
    cleanups.push(() => server.stop());
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));

    const client = createIpcClient(path);
    await client.connect();
    cleanups.push(() => client.disconnect());

    const processes = await client.call("ps.list");
    expect(Array.isArray(processes)).toBe(true);
  });

  it("returns error for unknown method", async () => {
    const { dir, path } = tempSocketPath();
    const server = createIpcServer(path);
    await server.start();
    cleanups.push(() => server.stop());
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));

    const client = createIpcClient(path);
    await client.connect();
    cleanups.push(() => client.disconnect());

    await expect(client.call("nonexistent")).rejects.toThrow("Method not found");
  });

  it("client handles server not running (ECONNREFUSED)", async () => {
    const { dir, path } = tempSocketPath();
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));

    const client = createIpcClient(path);
    await expect(client.connect()).rejects.toThrow();
  });

  it("cleans up socket file on server stop", async () => {
    const { dir, path } = tempSocketPath();
    const server = createIpcServer(path);
    await server.start();
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));

    expect(existsSync(path)).toBe(true);
    await server.stop();
    expect(existsSync(path)).toBe(false);
  });

  it("handles stale socket file on server start", async () => {
    const { dir, path } = tempSocketPath();
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));

    // Start and stop to leave a stale socket
    const server1 = createIpcServer(path);
    await server1.start();
    // Force close without cleaning up
    await server1.stop();

    // Manually re-create a stale file to simulate crash
    const { writeFileSync } = await import("node:fs");
    writeFileSync(path, "");

    // New server should handle the stale socket
    const server2 = createIpcServer(path);
    await server2.start();
    cleanups.push(() => server2.stop());

    const client = createIpcClient(path);
    await client.connect();
    cleanups.push(() => client.disconnect());

    const result = await client.call("status");
    expect(result).toEqual({ tui: true, pid: process.pid });
  });

  it("handles multiple sequential calls", async () => {
    const { dir, path } = tempSocketPath();
    const server = createIpcServer(path);
    await server.start();
    cleanups.push(() => server.stop());
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));

    const client = createIpcClient(path);
    await client.connect();
    cleanups.push(() => client.disconnect());

    const r1 = await client.call("status");
    const r2 = await client.call("ps.list");
    const r3 = await client.call("status");

    expect(r1).toEqual({ tui: true, pid: process.pid });
    expect(Array.isArray(r2)).toBe(true);
    expect(r3).toEqual(r1);
  });

  it("generates process id via RPC", async () => {
    const { dir, path } = tempSocketPath();
    const server = createIpcServer(path);
    await server.start();
    cleanups.push(() => server.stop());
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));

    const client = createIpcClient(path);
    await client.connect();
    cleanups.push(() => client.disconnect());

    const id = await client.call("ps.generate_id", { command: "npm", args: ["run", "dev"] });
    expect(typeof id).toBe("string");
    expect(id).toBe("npm-run-dev");
  });
});
