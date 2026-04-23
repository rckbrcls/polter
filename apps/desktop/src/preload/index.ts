import { contextBridge, ipcRenderer } from "electron";
import { createPolterBridge } from "./bridge.js";

contextBridge.exposeInMainWorld("polter", createPolterBridge(ipcRenderer));
