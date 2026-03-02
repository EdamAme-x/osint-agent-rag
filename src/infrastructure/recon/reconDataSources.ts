import * as dns from "node:dns/promises";
import { fetchWithTimeout } from "../http/fetchWithTimeout.js";
import { runCommand } from "../common/runCommand.js";
import {
  DOMAIN_RECON_CRTSH_NON_JSON_PREVIEW_MAX_CHARS,
  DOMAIN_RECON_CRTSH_SAMPLE_MAX_ROWS,
  DOMAIN_RECON_DEFAULT_CERT_LIMIT,
  DOMAIN_RECON_WHOIS_PREVIEW_MAX_CHARS,
  ERROR_PREVIEW_MAX_CHARS,
} from "../../config/constants.js";

async function resolveDns(domain: string) {
  const settle = async <T>(fn: () => Promise<T>): Promise<T | []> => {
    try {
      return await fn();
    } catch {
      return [];
    }
  };

  const [aRecords, aaaaRecords, cnameRecords, nsRecords, mxRecords, txtRecords] =
    await Promise.all([
      settle(() => dns.resolve4(domain)),
      settle(() => dns.resolve6(domain)),
      settle(() => dns.resolveCname(domain)),
      settle(() => dns.resolveNs(domain)),
      settle(() => dns.resolveMx(domain)),
      settle(() => dns.resolveTxt(domain)),
    ]);

  return {
    a: aRecords,
    aaaa: aaaaRecords,
    cname: cnameRecords,
    ns: nsRecords,
    mx: mxRecords,
    txt: txtRecords,
  };
}

async function fetchRdap(domain: string) {
  const response = await fetchWithTimeout(`https://rdap.org/domain/${domain}`);
  if (!response.ok) {
    return {
      error: `RDAP HTTP ${response.status}`,
    };
  }
  const body = (await response.json()) as Record<string, unknown>;
  const nameservers = Array.isArray(body.nameservers)
    ? body.nameservers
        .map((entry) =>
          entry && typeof entry === "object"
            ? (entry as Record<string, unknown>).ldhName
            : undefined
        )
        .filter((value): value is string => typeof value === "string")
    : [];
  return {
    ldhName: typeof body.ldhName === "string" ? body.ldhName : undefined,
    handle: typeof body.handle === "string" ? body.handle : undefined,
    status: Array.isArray(body.status) ? body.status : [],
    nameservers,
    links: Array.isArray(body.links)
      ? body.links
          .map((entry) =>
            entry && typeof entry === "object"
              ? (entry as Record<string, unknown>).href
              : undefined
          )
          .filter((value): value is string => typeof value === "string")
      : [],
  };
}

async function fetchCrtSh(domain: string, limit = DOMAIN_RECON_DEFAULT_CERT_LIMIT) {
  const q = encodeURIComponent(domain);
  const response = await fetchWithTimeout(`https://crt.sh/?q=${q}&output=json`);
  if (!response.ok) {
    return {
      error: `crt.sh HTTP ${response.status}`,
    };
  }
  const body = await response.text();
  let parsed: Array<Record<string, unknown>> = [];
  try {
    parsed = JSON.parse(body) as Array<Record<string, unknown>>;
  } catch {
    return {
      error: "crt.sh returned non-JSON response",
      preview: body.slice(0, DOMAIN_RECON_CRTSH_NON_JSON_PREVIEW_MAX_CHARS),
    };
  }

  const uniqueNames = new Set<string>();
  for (const row of parsed) {
    const nameValue = row.name_value;
    if (typeof nameValue === "string") {
      for (const value of nameValue.split("\n")) {
        if (value.trim()) {
          uniqueNames.add(value.trim());
        }
      }
    }
  }

  return {
    totalRows: parsed.length,
    uniqueNames: [...uniqueNames].slice(0, limit),
    sample: parsed.slice(0, Math.min(limit, DOMAIN_RECON_CRTSH_SAMPLE_MAX_ROWS)).map((entry) => ({
      id: entry.id,
      common_name: entry.common_name,
      name_value: entry.name_value,
      issuer_name: entry.issuer_name,
      entry_timestamp: entry.entry_timestamp,
      not_before: entry.not_before,
      not_after: entry.not_after,
    })),
  };
}

async function fetchWhois(domain: string) {
  const whoisResult = await runCommand("whois", [domain]);
  if (!whoisResult.ok) {
    return { error: whoisResult.error };
  }
  return {
    textPreview: whoisResult.stdout.slice(0, DOMAIN_RECON_WHOIS_PREVIEW_MAX_CHARS),
  };
}

async function fetchShodan(domain: string, shodanApiKey: string) {
  const endpoint = `https://api.shodan.io/dns/domain/${encodeURIComponent(
    domain
  )}?key=${encodeURIComponent(shodanApiKey)}`;
  const response = await fetchWithTimeout(endpoint);
  const body = await response.text();
  if (!response.ok) {
    return {
      error: `Shodan HTTP ${response.status}`,
      preview: body.slice(0, ERROR_PREVIEW_MAX_CHARS),
    };
  }
  try {
    return JSON.parse(body);
  } catch {
    return {
      error: "Shodan returned non-JSON response",
      preview: body.slice(0, ERROR_PREVIEW_MAX_CHARS),
    };
  }
}

export const reconDataSources = {
  resolveDns,
  fetchRdap,
  fetchCrtSh,
  fetchWhois,
  fetchShodan,
};
