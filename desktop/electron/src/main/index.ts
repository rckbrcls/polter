import { app } from "electron";
import { registerPolterIpcHandlers } from "./ipc.js";
import { createMainWindow } from "./window.js";

let registered = false;

async function bootstrap() {
  if (!registered) {
    registerPolterIpcHandlers();
    registered = true;
  }

  createMainWindow();
}

app.whenReady().then(bootstrap);

app.on("activate", () => {
  if (app.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
