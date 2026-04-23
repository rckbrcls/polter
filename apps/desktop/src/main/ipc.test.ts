import { describe, expect, it } from "vitest";
import { getCommandById } from "@polterware/core";
import { createPolterIpcHandlers } from "./ipc.js";
import { IPC_CHANNELS } from "../shared/ipc.js";

describe("createPolterIpcHandlers", () => {
  it("registers the public bridge surface", () => {
    const handlers = createPolterIpcHandlers();

    expect(handlers[IPC_CHANNELS.app.getInfo]).toBeTypeOf("function");
    expect(handlers[IPC_CHANNELS.commands.listFeatures]).toBeTypeOf("function");
    expect(handlers[IPC_CHANNELS.pipelines.save]).toBeTypeOf("function");
    expect(handlers[IPC_CHANNELS.processes.logs]).toBeTypeOf("function");
    expect(handlers[IPC_CHANNELS.skills.setup]).toBeTypeOf("function");
  });

  it("returns a real command form for known command ids", async () => {
    const handlers = createPolterIpcHandlers();
    const command = getCommandById("supabase:db");
    expect(command).toBeDefined();

    const form = await handlers[IPC_CHANNELS.commands.getForm]({} as never, {
      commandId: "supabase:db",
    });

    expect(form).toMatchObject({
      commandValue: "db",
    });
  });
});
