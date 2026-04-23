// JSON-RPC 2.0 types for IPC between the Polter runtime service and clients.

export interface RpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

export interface RpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

// Methods exposed by the runtime service:
// "ps.list"         → ProcessInfo[]
// "ps.start"        → { command, args, cwd, id? } → ProcessInfo
// "ps.stop"         → { id } → ProcessInfo
// "ps.logs"         → { id, tail?, stream? } → ProcessOutput
// "ps.remove"       → { id } → void
// "ps.find_by_cwd"  → { cwd, filter? } → ProcessInfo[]
// "ps.find_running"  → { cwd, command, args } → ProcessInfo | null
// "ps.generate_id"  → { command, args } → string
// "status"          -> { service: "polter", pid: number }

const DELIMITER = "\n";

export function serializeMessage(msg: RpcRequest | RpcResponse): string {
  return JSON.stringify(msg) + DELIMITER;
}

export function parseMessages(buffer: string): { messages: (RpcRequest | RpcResponse)[]; remainder: string } {
  const messages: (RpcRequest | RpcResponse)[] = [];
  let remainder = buffer;

  let idx: number;
  while ((idx = remainder.indexOf(DELIMITER)) !== -1) {
    const line = remainder.slice(0, idx);
    remainder = remainder.slice(idx + 1);

    if (line.length === 0) continue;

    try {
      messages.push(JSON.parse(line));
    } catch {
      // Skip malformed lines
    }
  }

  return { messages, remainder };
}
