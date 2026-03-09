import net from "node:net";
import ms from "ms";
import {
  serializeMessage,
  parseMessages,
  type RpcRequest,
  type RpcResponse,
} from "./ipcProtocol.js";

const DEFAULT_TIMEOUT = ms("5s");

export interface IpcClient {
  connect(): Promise<void>;
  disconnect(): void;
  call(method: string, params?: Record<string, unknown>): Promise<unknown>;
  isConnected(): boolean;
}

export function createIpcClient(socketPath: string): IpcClient {
  let socket: net.Socket | null = null;
  let connected = false;
  let nextId = 1;
  let buffer = "";
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  function handleData(data: Buffer) {
    buffer += data.toString();
    const { messages, remainder } = parseMessages(buffer);
    buffer = remainder;

    for (const msg of messages) {
      if ("id" in msg && !("method" in msg)) {
        const resp = msg as RpcResponse;
        const entry = pending.get(resp.id);
        if (entry) {
          pending.delete(resp.id);
          if (resp.error) {
            entry.reject(new Error(resp.error.message));
          } else {
            entry.resolve(resp.result);
          }
        }
      }
    }
  }

  return {
    connect() {
      return new Promise<void>((resolve, reject) => {
        let settled = false;
        socket = net.createConnection(socketPath);

        socket.on("connect", () => {
          connected = true;
          settled = true;
          resolve();
        });

        socket.on("data", handleData);

        socket.on("close", () => {
          connected = false;
          for (const entry of pending.values()) {
            entry.reject(new Error("Connection closed"));
          }
          pending.clear();
        });

        socket.on("error", (err) => {
          connected = false;
          if (!settled) {
            settled = true;
            reject(err);
          }
        });
      });
    },

    disconnect() {
      if (socket) {
        socket.destroy();
        socket = null;
        connected = false;
      }
    },

    isConnected() {
      return connected;
    },

    call(method: string, params?: Record<string, unknown>): Promise<unknown> {
      if (!socket || !connected) {
        return Promise.reject(new Error("Not connected"));
      }

      const id = nextId++;
      const request: RpcRequest = {
        jsonrpc: "2.0",
        id,
        method,
        ...(params !== undefined ? { params } : {}),
      };

      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`RPC call "${method}" timed out after ${DEFAULT_TIMEOUT}ms`));
        }, DEFAULT_TIMEOUT);

        pending.set(id, {
          resolve: (v) => {
            clearTimeout(timer);
            resolve(v);
          },
          reject: (e) => {
            clearTimeout(timer);
            reject(e);
          },
        });

        try {
          socket!.write(serializeMessage(request));
        } catch (err) {
          clearTimeout(timer);
          pending.delete(id);
          reject(err);
        }
      });
    },
  };
}
