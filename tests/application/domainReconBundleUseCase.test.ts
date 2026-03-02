import { describe, expect, it, vi } from "vitest";
import * as reconModule from "../../src/application/recon/domainReconBundleUseCase.js";

describe("domainReconBundleUseCase", () => {
  it("skips shodan when no key is provided (mock + spy)", async () => {
    const gateway = {
      resolveDns: vi.fn().mockResolvedValue({ a: [], aaaa: [], cname: [], ns: [], mx: [], txt: [] }),
      fetchRdap: vi.fn().mockResolvedValue({}),
      fetchCrtSh: vi.fn().mockResolvedValue({}),
      fetchWhois: vi.fn().mockResolvedValue({}),
      fetchShodan: vi.fn().mockResolvedValue({}),
    };
    const useCase = reconModule.createDomainReconBundleUseCase(gateway);

    const result = await useCase.execute({ target: "https://example.com" });

    expect(result.domain).toBe("example.com");
    expect(gateway.fetchShodan).not.toHaveBeenCalled();
    expect(result.shodan).toEqual({ skipped: "No shodanApiKey provided" });
  });

  it("calls shodan when key is provided", async () => {
    const gateway = {
      resolveDns: vi.fn().mockResolvedValue({ a: [], aaaa: [], cname: [], ns: [], mx: [], txt: [] }),
      fetchRdap: vi.fn().mockResolvedValue({}),
      fetchCrtSh: vi.fn().mockResolvedValue({}),
      fetchWhois: vi.fn().mockResolvedValue({}),
      fetchShodan: vi.fn().mockResolvedValue({ domain: "example.com" }),
    };
    const useCase = reconModule.createDomainReconBundleUseCase(gateway);

    await useCase.execute({ target: "example.com", shodanApiKey: "abc123" });

    expect(gateway.fetchShodan).toHaveBeenCalledWith("example.com", "abc123");
  });
});
