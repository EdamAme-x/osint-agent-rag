#!/usr/bin/env node

import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const thisFile = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(thisFile), "..");
const cwdWriteups = path.join(process.cwd(), "writeups");

if (!process.env.OSINT_AGENT_WRITEUPS_DIR && !existsSync(cwdWriteups)) {
  process.chdir(packageRoot);
}

if (!process.env.MCP_TRANSPORT) {
  process.env.MCP_TRANSPORT = "stdio";
}

await import("../dist/server.js");
