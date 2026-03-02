import { describe, expect, it } from "vitest";
import { resolveTransportMode } from "../../src/bootstrap/resolveTransportMode.js";

describe("resolveTransportMode", () => {
  it("defaults to http when no args or env are provided", () => {
    expect(resolveTransportMode([], undefined)).toBe("http");
  });

  it("reads --transport=value", () => {
    expect(resolveTransportMode(["--transport=stdio"], undefined)).toBe("stdio");
  });

  it("reads --transport value", () => {
    expect(resolveTransportMode(["--transport", "stdio"], undefined)).toBe("stdio");
  });

  it("falls back to MCP_TRANSPORT env", () => {
    expect(resolveTransportMode([], "stdio")).toBe("stdio");
  });

  it("prefers cli over env", () => {
    expect(resolveTransportMode(["--transport=http"], "stdio")).toBe("http");
  });

  it("throws on unsupported transport value", () => {
    expect(() => resolveTransportMode(["--transport=grpc"], undefined)).toThrow(
      "Unsupported --transport value"
    );
  });
});
