import { ipcMain, type IpcMain, type IpcMainInvokeEvent } from "electron";
import { IPC_CHANNELS } from "../shared/ipc.js";

type Handler = (event: IpcMainInvokeEvent, payload?: unknown) => unknown | Promise<unknown>;

export interface PolterIpcControllers {
  commander?: {
    hideOverlay(): void;
    showMainWindow(): void;
  };
}

function collectChannels(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.values(value).flatMap((entry) => collectChannels(entry));
}

function createUiOnlyHandler(channel: string): Handler {
  return async () => {
    throw new Error(`Polter Desktop is running in UI-only mode. ${channel} is not connected.`);
  };
}

export function createPolterIpcHandlers(
  controllers: PolterIpcControllers = {},
): Record<string, Handler> {
  const handlers = Object.fromEntries(
    collectChannels(IPC_CHANNELS).map((channel) => [channel, createUiOnlyHandler(channel)]),
  );

  if (controllers.commander) {
    handlers[IPC_CHANNELS.commander.hideOverlay] = async () => {
      controllers.commander?.hideOverlay();
    };
    handlers[IPC_CHANNELS.commander.showMainWindow] = async () => {
      controllers.commander?.showMainWindow();
    };
  }

  return handlers;
}

export function registerPolterIpcHandlers(
  controllers: PolterIpcControllers = {},
  target: Pick<IpcMain, "handle"> = ipcMain,
) {
  const handlers = createPolterIpcHandlers(controllers);
  for (const [channel, handler] of Object.entries(handlers)) {
    target.handle(channel, handler);
  }
  return handlers;
}
