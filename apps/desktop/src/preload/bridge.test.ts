import { describe, expect, it, vi } from "vitest";
import { createPolterBridge } from "./bridge.js";
import { IPC_CHANNELS } from "../shared/ipc.js";

describe("createPolterBridge", () => {
  it("routes command calls through the expected IPC channels", async () => {
    const invoke = vi.fn().mockResolvedValue([]);
    const bridge = createPolterBridge({ invoke });

    await bridge.commands.listFeatures();
    await bridge.commands.getForm("supabase:db");
    await bridge.repositories.add("/tmp/polter");
    await bridge.processes.stop("dev-server");
    await bridge.commander.hideOverlay();

    expect(invoke).toHaveBeenNthCalledWith(1, IPC_CHANNELS.commands.listFeatures, undefined);
    expect(invoke).toHaveBeenNthCalledWith(2, IPC_CHANNELS.commands.getForm, {
      commandId: "supabase:db",
    });
    expect(invoke).toHaveBeenNthCalledWith(3, IPC_CHANNELS.repositories.add, {
      path: "/tmp/polter",
    });
    expect(invoke).toHaveBeenNthCalledWith(4, IPC_CHANNELS.processes.stop, {
      id: "dev-server",
    });
    expect(invoke).toHaveBeenNthCalledWith(5, IPC_CHANNELS.commander.hideOverlay, undefined);
  });

  it("subscribes to Commander focus events and returns an unsubscribe function", () => {
    const invoke = vi.fn().mockResolvedValue([]);
    const listeners = new Map<string, (...args: unknown[]) => void>();
    const on = vi.fn((channel: string, listener: (...args: unknown[]) => void) => {
      listeners.set(channel, listener);
    });
    const removeListener = vi.fn();
    const bridge = createPolterBridge({ invoke, on, removeListener });
    const callback = vi.fn();

    const unsubscribe = bridge.commander.onFocusSearch(callback);
    listeners.get("commander:focus-search")?.();
    unsubscribe();

    expect(callback).toHaveBeenCalledOnce();
    expect(removeListener).toHaveBeenCalledWith(
      "commander:focus-search",
      listeners.get("commander:focus-search"),
    );
  });
});
