import { describe, expect, it, vi } from "vitest";
import { createPolterBridge } from "./bridge.js";
import { IPC_CHANNELS } from "../shared/ipc.js";

describe("createPolterBridge", () => {
  it("routes command calls through the expected IPC channels", async () => {
    const invoke = vi.fn().mockResolvedValue([]);
    const bridge = createPolterBridge({ invoke });

    await bridge.commands.listFeatures();
    await bridge.commands.getForm("supabase:db");
    await bridge.processes.stop("dev-server");

    expect(invoke).toHaveBeenNthCalledWith(1, IPC_CHANNELS.commands.listFeatures, undefined);
    expect(invoke).toHaveBeenNthCalledWith(2, IPC_CHANNELS.commands.getForm, {
      commandId: "supabase:db",
    });
    expect(invoke).toHaveBeenNthCalledWith(3, IPC_CHANNELS.processes.stop, {
      id: "dev-server",
    });
  });
});
