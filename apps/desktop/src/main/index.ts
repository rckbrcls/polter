import { app, globalShortcut } from "electron";
import log from "electron-log/main";
import { registerGlobalCommanderShortcut } from "./global-shortcuts.js";
import { registerPolterIpcHandlers } from "./ipc.js";
import {
  createMainWindow,
  getMainWindow,
  hideCommanderWindow,
  showMainWindow,
  toggleCommanderWindow,
} from "./window.js";

let unregisterCommanderShortcut: (() => void) | undefined;

function configureLogging() {
  log.initialize();
  log.transports.file.level = "info";
  log.transports.console.level = app.isPackaged ? "warn" : "debug";

  process.on("uncaughtException", (error) => {
    log.error("Uncaught exception in main process.", error);
  });

  process.on("unhandledRejection", (reason) => {
    log.error("Unhandled rejection in main process.", reason);
  });
}

async function bootstrap() {
  registerPolterIpcHandlers({
    commander: {
      hideOverlay: hideCommanderWindow,
      showMainWindow,
    },
  });

  createMainWindow();
  unregisterCommanderShortcut = registerGlobalCommanderShortcut({
    log,
    onToggleCommander: toggleCommanderWindow,
    shortcuts: globalShortcut,
  });
}

configureLogging();

app.whenReady().then(bootstrap).catch((error) => {
  log.error("Failed to bootstrap Polter Desktop.", error);
  app.quit();
});

app.on("activate", () => {
  if (!getMainWindow()) {
    createMainWindow();
    return;
  }

  showMainWindow();
});

app.on("will-quit", () => {
  unregisterCommanderShortcut?.();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
