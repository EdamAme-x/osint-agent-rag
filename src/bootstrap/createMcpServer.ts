import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "@/presentation/mcp/registerTools";
import { loadWriteups } from "@/writeups";

export async function createMcpServer(projectRoot = process.cwd()) {
  const writeupsRoot = path.join(projectRoot, "writeups");
  const docs = await loadWriteups(writeupsRoot);

  const mcpServer = new McpServer({
    name: "OSINT MCP",
    version: "0.2.0",
  });

  registerTools(mcpServer, docs);
  return {
    mcpServer,
    docs,
  };
}
