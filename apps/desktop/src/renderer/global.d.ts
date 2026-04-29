import type { PolterBridge } from "../preload/bridge.js";

declare global {
  interface Window {
    polter?: PolterBridge;
  }
}

export {};
