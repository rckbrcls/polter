import net from "node:net";
import { mkdirSync, unlinkSync, existsSync } from "./fs.js";
import { dirname } from "node:path";
import { z } from "zod";
import {
  serializeMessage,
  parseMessages,
  type RpcRequest,
  type RpcResponse,
} from "./ipcProtocol.js";
import {
  listProcesses,
  startProcess,
  stopProcess,
  getProcessOutput,
  removeProcess,
  findProcessesByCwd,
  findRunningByCommand,
  generateProcessId,
} from "./processManager.js";

type RpcHandler = (params: Record<string, unknown>) => unknown | Promise<unknown>;

const PsStartParams = z.object({
  command: z.string(),
  args: z.array(z.string()).default([]),
  cwd: z.string().default(process.cwd()),
  id: z.string().optional(),
});

const PsIdParams = z.object({
  id: z.string(),
});

const PsLogsParams = z.object({
  id: z.string(),
  tail: z.number().optional(),
  stream: z.enum(["stdout", "stderr", "both"]).optional(),
});

const PsFindByCwdParams = z.object({
  cwd: z.string(),
  filter: z.string().optional(),
});

const PsFindRunningParams = z.object({
  cwd: z.string(),
  command: z.string(),
  args: z.array(z.string()),
});

const PsGenerateIdParams = z.object({
  command: z.string(),
  args: z.array(z.string()),
});

const handlers: Record<string, RpcHandler> = {
  "ps.list": () => listProcesses(),

  "ps.start": (params) => {
    const { command, args, cwd, id } = PsStartParams.parse(params);
    return startProcess(id ?? generateProcessId(command, args), command, args, cwd);
  },

  "ps.stop": async (params) => {
    const { id } = PsIdParams.parse(params);
    return stopProcess(id);
  },

  "ps.logs": (params) => {
    const { id, tail, stream } = PsLogsParams.parse(params);
    return getProcessOutput(id, tail, stream);
  },

  "ps.remove": (params) => {
    const { id } = PsIdParams.parse(params);
    removeProcess(id);
    return null;
  },

  "ps.find_by_cwd": (params) => {
    const { cwd, filter } = PsFindByCwdParams.parse(params);
    let processes = findProcessesByCwd(cwd);
    if (filter) {
      const f = filter.toLowerCase();
      processes = processes.filter((p) =>
        (p.command + " " + p.args.join(" ")).toLowerCase().includes(f),
      );
    }
    return processes;
  },

  "ps.find_running": (params) => {
    const { cwd, command, args } = PsFindRunningParams.parse(params);
    return findRunningByCommand(cwd, command, args) ?? null;
  },

  "ps.generate_id": (params) => {
    const { command, args } = PsGenerateIdParams.parse(params);
    return generateProcessId(command, args);
  },

  status: () => ({ service: "polter", pid: process.pid }),
};

async function handleRequest(req: RpcRequest): Promise<RpcResponse> {
  const handler = handlers[req.method];
  if (!handler) {
    return {
      jsonrpc: "2.0",
      id: req.id,
      error: { code: -32601, message: `Method not found: ${req.method}` },
    };
  }

  try {
    const result = await handler(req.params ?? {});
    return { jsonrpc: "2.0", id: req.id, result };
  } catch (err) {
    return {
      jsonrpc: "2.0",
      id: req.id,
      error: { code: -32000, message: (err as Error).message },
    };
  }
}

export interface IpcServer {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export function createIpcServer(socketPath: string): IpcServer {
  let server: net.Server | null = null;
  const connections = new Set<net.Socket>();

  function handleConnection(socket: net.Socket) {
    connections.add(socket);
    let buffer = "";

    socket.on("data", async (data) => {
      buffer += data.toString();
      const { messages, remainder } = parseMessages(buffer);
      buffer = remainder;

      for (const msg of messages) {
        if ("method" in msg) {
          const response = await handleRequest(msg as RpcRequest);
          try {
            socket.write(serializeMessage(response));
          } catch {
            // Socket may have closed
          }
        }
      }
    });

    socket.on("close", () => {
      connections.delete(socket);
    });

    socket.on("error", () => {
      connections.delete(socket);
    });
  }

  async function cleanStaleSocket(): Promise<void> {
    if (!existsSync(socketPath)) return;

    // Try connecting to see if a server is already running
    return new Promise((resolve) => {
      const probe = net.createConnection(socketPath);
      probe.on("connect", () => {
        // Another server is running — don't take over
        probe.destroy();
        resolve();
      });
      probe.on("error", () => {
        // Stale socket file — remove it
        try {
          unlinkSync(socketPath);
        } catch {
          // Already gone
        }
        resolve();
      });
    });
  }

  return {
    async start() {
      mkdirSync(dirname(socketPath), { recursive: true });
      await cleanStaleSocket();

      return new Promise<void>((resolve, reject) => {
        server = net.createServer(handleConnection);

        server.on("error", (err: NodeJS.ErrnoException) => {
          if (err.code === "EADDRINUSE") {
            // Try removing stale socket and retry once
            try {
              unlinkSync(socketPath);
            } catch { /* ignore */ }
            server!.listen(socketPath, () => resolve());
          } else {
            reject(err);
          }
        });

        server.listen(socketPath, () => resolve());
      });
    },

    async stop() {
      for (const conn of connections) {
        conn.destroy();
      }
      connections.clear();

      return new Promise<void>((resolve) => {
        if (!server) {
          resolve();
          return;
        }
        server.close(() => {
          try {
            unlinkSync(socketPath);
          } catch {
            // Already gone
          }
          server = null;
          resolve();
        });
      });
    },
  };
}
