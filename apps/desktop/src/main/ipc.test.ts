import { describe, expect, it, vi } from "vitest";
import { createPolterIpcHandlers } from "./ipc.js";
import { IPC_CHANNELS } from "../shared/ipc.js";

describe("createPolterIpcHandlers", () => {
  it("registers the public bridge surface", () => {
    const handlers = createPolterIpcHandlers();

    expect(handlers[IPC_CHANNELS.app.getInfo]).toBeTypeOf("function");
    expect(handlers[IPC_CHANNELS.commands.listFeatures]).toBeTypeOf("function");
    expect(handlers[IPC_CHANNELS.repositories.list]).toBeTypeOf("function");
    expect(handlers[IPC_CHANNELS.repositories.pickDirectory]).toBeTypeOf("function");
    expect(handlers[IPC_CHANNELS.pipelines.save]).toBeTypeOf("function");
    expect(handlers[IPC_CHANNELS.processes.logs]).toBeTypeOf("function");
    expect(handlers[IPC_CHANNELS.skills.setup]).toBeTypeOf("function");
    expect(handlers[IPC_CHANNELS.commander.hideOverlay]).toBeTypeOf("function");
  });

  it("keeps dormant handlers disconnected in UI-only mode", async () => {
    const handlers = createPolterIpcHandlers();
    const handler = handlers[IPC_CHANNELS.commands.getForm];

    await expect(handler({} as never, { commandId: "git:status" })).rejects.toThrow(
      "UI-only mode",
    );
  });

  it("wires Commander window controls when controllers are provided", async () => {
    const commander = {
      hideOverlay: vi.fn(),
      showMainWindow: vi.fn(),
    };
    const handlers = createPolterIpcHandlers({ commander });

    await handlers[IPC_CHANNELS.commander.hideOverlay]?.({} as never);
    await handlers[IPC_CHANNELS.commander.showMainWindow]?.({} as never);

    expect(commander.hideOverlay).toHaveBeenCalledOnce();
    expect(commander.showMainWindow).toHaveBeenCalledOnce();
  });
});
