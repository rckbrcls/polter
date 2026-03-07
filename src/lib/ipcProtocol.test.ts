import { describe, it, expect } from "vitest";
import { serializeMessage, parseMessages, type RpcRequest, type RpcResponse } from "./ipcProtocol.js";

describe("ipcProtocol", () => {
  describe("serializeMessage", () => {
    it("serializes a request with newline delimiter", () => {
      const req: RpcRequest = { jsonrpc: "2.0", id: 1, method: "ps.list" };
      const result = serializeMessage(req);
      expect(result).toBe('{"jsonrpc":"2.0","id":1,"method":"ps.list"}\n');
    });

    it("serializes a response with newline delimiter", () => {
      const resp: RpcResponse = { jsonrpc: "2.0", id: 1, result: [1, 2, 3] };
      const result = serializeMessage(resp);
      expect(result.endsWith("\n")).toBe(true);
      expect(JSON.parse(result.trim())).toEqual(resp);
    });
  });

  describe("parseMessages", () => {
    it("parses a single complete message", () => {
      const input = '{"jsonrpc":"2.0","id":1,"method":"status"}\n';
      const { messages, remainder } = parseMessages(input);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({ jsonrpc: "2.0", id: 1, method: "status" });
      expect(remainder).toBe("");
    });

    it("parses multiple messages", () => {
      const input = '{"jsonrpc":"2.0","id":1,"method":"a"}\n{"jsonrpc":"2.0","id":2,"method":"b"}\n';
      const { messages, remainder } = parseMessages(input);
      expect(messages).toHaveLength(2);
      expect(remainder).toBe("");
    });

    it("keeps incomplete message as remainder", () => {
      const input = '{"jsonrpc":"2.0","id":1,"method":"a"}\n{"jsonrpc":"2.0","id":2';
      const { messages, remainder } = parseMessages(input);
      expect(messages).toHaveLength(1);
      expect(remainder).toBe('{"jsonrpc":"2.0","id":2');
    });

    it("handles empty input", () => {
      const { messages, remainder } = parseMessages("");
      expect(messages).toHaveLength(0);
      expect(remainder).toBe("");
    });

    it("skips malformed lines", () => {
      const input = 'not-json\n{"jsonrpc":"2.0","id":1,"result":true}\n';
      const { messages, remainder } = parseMessages(input);
      expect(messages).toHaveLength(1);
      expect(remainder).toBe("");
    });
  });
});
