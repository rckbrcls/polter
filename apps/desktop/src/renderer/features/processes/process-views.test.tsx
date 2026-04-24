import type { ProcessInfo } from "../workbench/types.js";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Workbench } from "../workbench/use-workbench.js";
import { ProcessesView } from "./process-views.js";

function processInfo(overrides: Partial<ProcessInfo> = {}): ProcessInfo {
  return {
    id: "desktop-dev",
    command: "pnpm",
    args: ["dev"],
    cwd: "/workspace/polter",
    pid: 123,
    status: "running",
    exitCode: null,
    signal: null,
    startedAt: "2026-04-24T00:00:00.000Z",
    exitedAt: null,
    uptime: 1000,
    ...overrides,
  };
}

function workbench(overrides: Partial<Workbench> = {}): Workbench {
  return {
    deferredProcessOutput: "",
    processArgsText: "",
    processCommand: "",
    processes: [],
    refreshProcesses: vi.fn(),
    removeSelectedProcess: vi.fn(),
    selectedProcessId: "",
    setProcessArgsText: vi.fn(),
    setProcessCommand: vi.fn(),
    setSelectedProcessId: vi.fn(),
    startManualProcess: vi.fn(),
    stopSelectedProcess: vi.fn(),
    ...overrides,
  } as unknown as Workbench;
}

describe("ProcessesView", () => {
  it("renders the empty process state", () => {
    const markup = renderToStaticMarkup(<ProcessesView workbench={workbench()} />);

    expect(markup).toContain("No processes tracked");
    expect(markup).toContain("No process selected");
    expect(markup).toContain("Start Process");
  });

  it("renders a running process with logs and stop action", () => {
    const markup = renderToStaticMarkup(
      <ProcessesView
        workbench={workbench({
          deferredProcessOutput: "server ready",
          processes: [processInfo()],
          selectedProcessId: "desktop-dev",
        })}
      />,
    );

    expect(markup).toContain("desktop-dev");
    expect(markup).toContain("server ready");
    expect(markup).toContain("running");
    expect(markup).toContain("Stop");
    expect(markup).toContain("Remove");
  });

  it("renders an exited process with remove action", () => {
    const markup = renderToStaticMarkup(
      <ProcessesView
        workbench={workbench({
          processes: [
            processInfo({
              status: "exited",
              exitCode: 0,
              exitedAt: "2026-04-24T00:01:00.000Z",
            }),
          ],
          selectedProcessId: "desktop-dev",
        })}
      />,
    );

    expect(markup).toContain("exited");
    expect(markup).toContain("Stop");
    expect(markup).toContain("Remove");
    expect(markup).toContain(">0<");
  });
});
