import {
  MCP_TRANSPORT_DEFAULT,
  MCP_TRANSPORT_HTTP,
  MCP_TRANSPORT_STDIO,
  MCP_TRANSPORT_SUPPORTED,
} from "@/config/constants";

export type McpTransportMode = typeof MCP_TRANSPORT_SUPPORTED[number];

const TRANSPORT_ARG_PREFIX = "--transport=";
const TRANSPORT_ARG_KEY = "--transport";

function parseTransportMode(value: string | undefined): McpTransportMode | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === MCP_TRANSPORT_HTTP || normalized === MCP_TRANSPORT_STDIO) {
    return normalized;
  }
  return undefined;
}

function readCliTransportMode(args: string[]): string | undefined {
  const flagArg = args.find((arg) => arg.startsWith(TRANSPORT_ARG_PREFIX));
  if (flagArg) {
    return flagArg.slice(TRANSPORT_ARG_PREFIX.length);
  }
  const modeIndex = args.findIndex((arg) => arg === TRANSPORT_ARG_KEY);
  if (modeIndex >= 0) {
    return args[modeIndex + 1];
  }
  return undefined;
}

export function resolveTransportMode(args: string[], envMode?: string): McpTransportMode {
  const cliValue = readCliTransportMode(args);
  const cliMode = parseTransportMode(cliValue);
  if (cliValue && !cliMode) {
    throw new Error(
      `Unsupported --transport value: ${cliValue}. Supported: ${MCP_TRANSPORT_SUPPORTED.join(", ")}`
    );
  }

  const envTransportMode = parseTransportMode(envMode);
  if (envMode && !envTransportMode) {
    throw new Error(
      `Unsupported MCP_TRANSPORT value: ${envMode}. Supported: ${MCP_TRANSPORT_SUPPORTED.join(", ")}`
    );
  }

  return cliMode ?? envTransportMode ?? MCP_TRANSPORT_DEFAULT;
}
