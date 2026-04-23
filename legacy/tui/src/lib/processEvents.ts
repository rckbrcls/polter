import EE from "eventemitter3";
import type { ProcessInfo } from "./processManager.js";

interface ProcessEvents {
  started: (info: ProcessInfo) => void;
  stopped: (info: ProcessInfo) => void;
  errored: (info: ProcessInfo, error: string) => void;
  output: (id: string, stream: "stdout" | "stderr", data: string) => void;
}

const EventEmitter = EE.EventEmitter ?? EE;
export const processEvents = new EventEmitter<ProcessEvents>();
