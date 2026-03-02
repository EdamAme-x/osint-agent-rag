import { serve } from "@hono/node-server";
import { StreamableHTTPTransport } from "@hono/mcp";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMcpServer } from "@/bootstrap/createMcpServer";
import { resolveTransportMode } from "@/bootstrap/resolveTransportMode";
import {
  DEFAULT_SERVER_PORT,
  MCP_HEALTH_PATH,
  MCP_HTTP_PATH,
  MCP_TRANSPORT_HTTP,
} from "@/config/constants";

const CORS_ALLOW_METHODS = ["GET", "POST", "DELETE", "OPTIONS"];
const CORS_ALLOW_HEADERS = [
  "Content-Type",
  "Accept",
  "Last-Event-ID",
  "mcp-session-id",
  "mcp-protocol-version",
];
const CORS_EXPOSE_HEADERS = ["mcp-session-id", "mcp-protocol-version"];

async function startHttpServer(mcpServer: McpServer, writeupCount: number) {
  const app = new Hono();
  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: CORS_ALLOW_METHODS,
      allowHeaders: CORS_ALLOW_HEADERS,
      exposeHeaders: CORS_EXPOSE_HEADERS,
    })
  );

  app.get(MCP_HEALTH_PATH, (c) =>
    c.json({
      status: "ok",
      writeupCount,
      mcpPath: MCP_HTTP_PATH,
    })
  );

  const transport = new StreamableHTTPTransport();
  app.all(MCP_HTTP_PATH, async (c) => {
    if (!mcpServer.isConnected()) {
      await mcpServer.connect(transport);
    }
    return transport.handleRequest(c);
  });

  const port = Number(process.env.PORT ?? process.env.MCP_PORT ?? DEFAULT_SERVER_PORT);
  serve({ fetch: app.fetch, port });
  console.log(`[osint-agent-rag] listening on http://localhost:${port}`);
  console.log(`[osint-agent-rag] writeups loaded: ${writeupCount}`);
}

async function startStdioServer(mcpServer: McpServer, writeupCount: number) {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error(`[osint-agent-rag] stdio transport ready (writeups loaded: ${writeupCount})`);
}

async function main() {
  const transportMode = resolveTransportMode(process.argv.slice(2), process.env.MCP_TRANSPORT);
  const { mcpServer, docs } = await createMcpServer();

  if (transportMode === MCP_TRANSPORT_HTTP) {
    await startHttpServer(mcpServer, docs.length);
    return;
  }
  await startStdioServer(mcpServer, docs.length);
}

main().catch((error) => {
  console.error("[osint-agent-rag] startup failed:", error);
  process.exit(1);
});
