import { app, BrowserWindow, shell } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function canOpenExternalUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    title: "Polter Desktop",
    backgroundColor: "#0d1117",
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  window.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (canOpenExternalUrl(url)) {
      void shell.openExternal(url);
    }

    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    const isDevelopmentRenderer =
      !app.isPackaged && url === process.env["ELECTRON_RENDERER_URL"];
    const isPackagedRenderer =
      url === pathToFileURL(join(__dirname, "../renderer/index.html")).toString();

    if (isDevelopmentRenderer || isPackagedRenderer) {
      return;
    }

    event.preventDefault();

    if (canOpenExternalUrl(url)) {
      void shell.openExternal(url);
    }
  });

  window.once("ready-to-show", () => {
    window.show();
  });

  const rendererUrl = process.env["ELECTRON_RENDERER_URL"];
  if (!app.isPackaged && rendererUrl) {
    void window.loadURL(rendererUrl);
  } else {
    void window.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return window;
}
