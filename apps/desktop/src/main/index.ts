import { app, BrowserWindow } from "electron";
import log from "electron-log/main";
import { createMainWindow } from "./window.js";

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
  createMainWindow();
}

configureLogging();

app.whenReady().then(bootstrap).catch((error) => {
  log.error("Failed to bootstrap Polter Desktop.", error);
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
