import { DOMAIN_RECON_DEFAULT_CERT_LIMIT } from "../../config/constants.js";

type DnsBundle = {
  a: unknown;
  aaaa: unknown;
  cname: unknown;
  ns: unknown;
  mx: unknown;
  txt: unknown;
};

export interface DomainReconGateway {
  resolveDns(domain: string): Promise<DnsBundle>;
  fetchRdap(domain: string): Promise<unknown>;
  fetchCrtSh(domain: string, limit: number): Promise<unknown>;
  fetchWhois(domain: string): Promise<unknown>;
  fetchShodan(domain: string, shodanApiKey: string): Promise<unknown>;
}

export type DomainReconBundleInput = {
  target: string;
  certLimit?: number;
  shodanApiKey?: string;
};

export function normalizeTargetToDomain(target: string): string {
  const trimmed = target.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }
  if (trimmed.includes("://")) {
    try {
      return new URL(trimmed).hostname.replace(/\.$/, "");
    } catch {
      return trimmed.replace(/\.$/, "");
    }
  }
  if (trimmed.includes("/")) {
    try {
      return new URL(`https://${trimmed}`).hostname.replace(/\.$/, "");
    } catch {
      return trimmed.split("/")[0].replace(/\.$/, "");
    }
  }
  return trimmed.replace(/\.$/, "");
}

export function createDomainReconBundleUseCase(gateway: DomainReconGateway) {
  return {
    async execute(input: DomainReconBundleInput) {
      const domain = normalizeTargetToDomain(input.target);
      if (!domain) {
        throw new Error(`Could not derive a domain from: ${input.target}`);
      }

      const [dnsInfo, rdapInfo, crtshInfo, whoisInfo, shodanInfo] = await Promise.all([
        gateway.resolveDns(domain),
        gateway.fetchRdap(domain),
        gateway.fetchCrtSh(domain, input.certLimit ?? DOMAIN_RECON_DEFAULT_CERT_LIMIT),
        gateway.fetchWhois(domain),
        input.shodanApiKey
          ? gateway.fetchShodan(domain, input.shodanApiKey)
          : Promise.resolve({ skipped: "No shodanApiKey provided" }),
      ]);

      return {
        target: input.target,
        domain,
        dns: dnsInfo,
        rdap: rdapInfo,
        crtsh: crtshInfo,
        whois: whoisInfo,
        shodan: shodanInfo,
      };
    },
  };
}
