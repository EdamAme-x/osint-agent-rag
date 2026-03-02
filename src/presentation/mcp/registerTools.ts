import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import {
  ARCHIVE_MAX_LIMIT,
  CAPSOLVER_DEFAULT_POLL_INTERVAL_MS,
  CAPSOLVER_DEFAULT_POLL_TIMEOUT_MS,
  CAPSOLVER_MAX_POLL_INTERVAL_MS,
  CAPSOLVER_MAX_POLL_TIMEOUT_MS,
  CAPSOLVER_MIN_POLL_INTERVAL_MS,
  CAPSOLVER_MIN_POLL_TIMEOUT_MS,
  CAPSOLVER_TIMEOUT_MS,
  DUCKDUCKGO_DEFAULT_LIMIT,
  DUCKDUCKGO_MAX_LIMIT,
  DOMAIN_LIST_DEFAULT_LIMIT,
  DOMAIN_LIST_MAX_LIMIT,
  DOMAIN_RECON_DEFAULT_CERT_LIMIT,
  DOMAIN_RECON_MAX_CERT_LIMIT,
  ERROR_PREVIEW_MAX_CHARS,
  JINA_DEFAULT_MAX_CHARS,
  JINA_MAX_MAX_CHARS,
  JINA_MIN_MAX_CHARS,
  JINA_TIMEOUT_MS,
  MEDIA_MAX_DOWNLOAD_TIMEOUT_MS,
  MEDIA_MAX_MAX_DOWNLOAD_BYTES,
  MEDIA_MIN_DOWNLOAD_TIMEOUT_MS,
  MEDIA_MIN_MAX_DOWNLOAD_BYTES,
  TWSTALKER_DEFAULT_LIMIT,
  TWSTALKER_MAX_LIMIT,
  WAYBACK_DEFAULT_LIMIT,
  WAYBACK_MAX_LIMIT,
  WAYBACK_TIMEOUT_MS,
  WRITEUP_SEARCH_DEFAULT_LIMIT,
  WRITEUP_SEARCH_MAX_LIMIT,
  YANDEX_IMAGE_DEFAULT_LIMIT,
  YANDEX_IMAGE_MAX_LIMIT,
} from "@/config/constants";
import { createArchiveTodayLookupUseCase } from "@/application/archive/archiveTodayLookupUseCase";
import { createDuckduckgoSearchUseCase } from "@/application/duckduckgo/duckduckgoSearchUseCase";
import { createExtractMediaMetadataUseCase } from "@/application/media/extractMediaMetadataUseCase";
import { createDomainReconBundleUseCase } from "@/application/recon/domainReconBundleUseCase";
import { createTwstalkerProfileLookupUseCase } from "@/application/twstalker/twstalkerProfileLookupUseCase";
import { createYandexImageSearchUseCase } from "@/application/yandexImage/yandexImageSearchUseCase";
import { archiveTodayGateway } from "@/infrastructure/archive/archiveTodayGateway";
import { duckduckgoSearchGateway } from "@/infrastructure/duckduckgo/duckduckgoSearchGateway";
import { fetchWithTimeout } from "@/infrastructure/http/fetchWithTimeout";
import { metadataExtractor } from "@/infrastructure/media/metadataExtractor";
import { reconDataSources } from "@/infrastructure/recon/reconDataSources";
import { twstalkerProfileGateway } from "@/infrastructure/twstalker/twstalkerProfileGateway";
import { yandexImageSearchGateway } from "@/infrastructure/yandex/yandexImageSearchGateway";
import { collectTopDomains, searchWriteups, type WriteupDoc } from "@/writeups";
import { runValidatedTool } from "./runValidatedTool.js";
import {
  archiveTodayLookupInputSchema,
  capsolverCreateAndPollInputSchema,
  domainReconBundleInputSchema,
  duckduckgoSearchInputSchema,
  extractMetadataFromMediaInputSchema,
  jinaFetchUrlInputSchema,
  listFrequentDomainsInputSchema,
  searchPastWriteupsInputSchema,
  twstalkerProfileLookupInputSchema,
  waybackCdxLookupInputSchema,
  yandexImageSearchInputSchema,
} from "./toolSchemas.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function registerTools(server: McpServer, docs: WriteupDoc[]) {
  const yandexImageSearchUseCase = createYandexImageSearchUseCase(yandexImageSearchGateway);
  const duckduckgoSearchUseCase = createDuckduckgoSearchUseCase(duckduckgoSearchGateway);
  const archiveTodayLookupUseCase = createArchiveTodayLookupUseCase(archiveTodayGateway);
  const domainReconBundleUseCase = createDomainReconBundleUseCase(reconDataSources);
  const extractMediaMetadataUseCase = createExtractMediaMetadataUseCase(metadataExtractor);
  const twstalkerProfileLookupUseCase =
    createTwstalkerProfileLookupUseCase(twstalkerProfileGateway);

  server.registerTool(
    "search_past_writeups",
    {
      description:
        "Search local writeups and return the best matching challenge hints/snippets.",
      inputSchema: {
        query: z.string().min(1).describe("Search query"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(WRITEUP_SEARCH_MAX_LIMIT)
          .optional()
          .describe(`Maximum number of matches (default: ${WRITEUP_SEARCH_DEFAULT_LIMIT})`),
        series: z
          .string()
          .optional()
          .describe("Optional series filter, e.g. diver2025 or swimmer2026"),
        category: z
          .string()
          .optional()
          .describe("Optional category filter, e.g. geo/recon/history"),
        pathContains: z
          .string()
          .optional()
          .describe("Optional substring filter against writeup path"),
      },
    },
    async (input) =>
      runValidatedTool(searchPastWriteupsInputSchema, input, async (validated) => {
        const top = searchWriteups(
          docs,
          validated.query,
          validated.limit ?? WRITEUP_SEARCH_DEFAULT_LIMIT,
          {
            series: validated.series,
            category: validated.category,
            pathContains: validated.pathContains,
          }
        );
        return {
          totalWriteups: docs.length,
          matches: top,
        };
      })
  );

  server.registerTool(
    "list_frequent_domains_in_writeups",
    {
      description:
        "List most frequently referenced domains in writeups to prioritize OSINT integrations.",
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(DOMAIN_LIST_MAX_LIMIT)
          .optional()
          .describe(`How many domains to return (default: ${DOMAIN_LIST_DEFAULT_LIMIT})`),
      },
    },
    async (input) =>
      runValidatedTool(listFrequentDomainsInputSchema, input, async (validated) => ({
        totalWriteups: docs.length,
        domains: collectTopDomains(docs, validated.limit ?? DOMAIN_LIST_DEFAULT_LIMIT),
      }))
  );

  server.registerTool(
    "duckduckgo_search_api",
    {
      description:
        "Search using DuckDuckGo Instant Answer API without an API key.",
      inputSchema: {
        query: z.string().min(1).describe("Search query"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(DUCKDUCKGO_MAX_LIMIT)
          .optional()
          .describe(`Maximum number of hits to return (default: ${DUCKDUCKGO_DEFAULT_LIMIT})`),
      },
    },
    async (input) =>
      runValidatedTool(duckduckgoSearchInputSchema, input, async (validated) =>
        duckduckgoSearchUseCase.execute({
          query: validated.query,
          limit: validated.limit,
        })
      )
  );

  server.registerTool(
    "yandex_image_search_scrape",
    {
      description:
        "Scrape Yandex Images search result page and return image hits without requiring an API key.",
      inputSchema: {
        query: z.string().min(1).describe("Image search query"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(YANDEX_IMAGE_MAX_LIMIT)
          .optional()
          .describe(`Maximum number of hits to return (default: ${YANDEX_IMAGE_DEFAULT_LIMIT})`),
        lr: z
          .number()
          .int()
          .optional()
          .describe("Optional Yandex region code (e.g. 213)"),
      },
    },
    async (input) =>
      runValidatedTool(yandexImageSearchInputSchema, input, async (validated) =>
        yandexImageSearchUseCase.execute({
          query: validated.query,
          limit: validated.limit,
          lr: validated.lr,
        })
      )
  );

  server.registerTool(
    "archive_today_lookup",
    {
      description:
        "Query archive.today/archive.md timemap for a URL and return archived snapshots.",
      inputSchema: {
        url: z.string().min(1).describe("Target URL"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(ARCHIVE_MAX_LIMIT)
          .optional()
          .describe("Maximum mementos to return"),
      },
    },
    async (input) =>
      runValidatedTool(archiveTodayLookupInputSchema, input, async (validated) =>
        archiveTodayLookupUseCase.execute({ url: validated.url, limit: validated.limit })
      )
  );

  server.registerTool(
    "domain_recon_bundle",
    {
      description:
        "Run domain recon bundle (DNS, RDAP, crt.sh, WHOIS, optional Shodan).",
      inputSchema: {
        target: z
          .string()
          .min(1)
          .describe("Domain or URL target (e.g. example.com or https://example.com)"),
        certLimit: z
          .number()
          .int()
          .min(1)
          .max(DOMAIN_RECON_MAX_CERT_LIMIT)
          .optional()
          .describe(`Maximum unique certificate names (default: ${DOMAIN_RECON_DEFAULT_CERT_LIMIT})`),
        shodanApiKey: z
          .string()
          .optional()
          .describe("Optional Shodan API key for DNS domain lookup"),
      },
    },
    async (input) =>
      runValidatedTool(domainReconBundleInputSchema, input, async (validated) =>
        domainReconBundleUseCase.execute({
          target: validated.target,
          certLimit: validated.certLimit,
          shodanApiKey: validated.shodanApiKey,
        })
      )
  );

  server.registerTool(
    "extract_metadata_from_media",
    {
      description:
        "Extract metadata from local media file or remote URL using exiftool/ffprobe/exifr.",
      inputSchema: {
        filePath: z
          .string()
          .optional()
          .describe("Local media path (image/video/audio/document)"),
        url: z.string().optional().describe("Remote media URL to download and inspect"),
        maxDownloadBytes: z
          .number()
          .int()
          .min(MEDIA_MIN_MAX_DOWNLOAD_BYTES)
          .max(MEDIA_MAX_MAX_DOWNLOAD_BYTES)
          .optional()
          .describe("Max bytes for URL download"),
        downloadTimeoutMs: z
          .number()
          .int()
          .min(MEDIA_MIN_DOWNLOAD_TIMEOUT_MS)
          .max(MEDIA_MAX_DOWNLOAD_TIMEOUT_MS)
          .optional()
          .describe("Download timeout in ms"),
      },
    },
    async (input) =>
      runValidatedTool(extractMetadataFromMediaInputSchema, input, async (validated) => {
        const result = await extractMediaMetadataUseCase.execute({
          filePath: validated.filePath,
          url: validated.url,
          maxDownloadBytes: validated.maxDownloadBytes,
          downloadTimeoutMs: validated.downloadTimeoutMs,
        });
        if (
          result &&
          typeof result === "object" &&
          "error" in (result as Record<string, unknown>)
        ) {
          throw new Error(String((result as Record<string, unknown>).error));
        }
        return result;
      })
  );

  server.registerTool(
    "wayback_cdx_lookup",
    {
      description:
        "Query Wayback Machine CDX API and return archived snapshots for a URL pattern.",
      inputSchema: {
        url: z.string().min(1).describe("Target URL or wildcard host/path"),
        from: z
          .string()
          .optional()
          .describe("Optional start date in YYYYMMDD[hhmmss]"),
        to: z
          .string()
          .optional()
          .describe("Optional end date in YYYYMMDD[hhmmss]"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(WAYBACK_MAX_LIMIT)
          .optional()
          .describe(`Max number of rows (default: ${WAYBACK_DEFAULT_LIMIT})`),
      },
    },
    async (input) =>
      runValidatedTool(waybackCdxLookupInputSchema, input, async (validated) => {
        const query = new URLSearchParams({
          url: validated.url,
          output: "json",
          fl: "timestamp,original,statuscode,mimetype,digest,length",
          limit: String(validated.limit ?? WAYBACK_DEFAULT_LIMIT),
        });
        if (validated.from) {
          query.set("from", validated.from);
        }
        if (validated.to) {
          query.set("to", validated.to);
        }
        const endpoint = `https://web.archive.org/cdx/search/cdx?${query.toString()}`;
        const response = await fetchWithTimeout(endpoint, undefined, WAYBACK_TIMEOUT_MS);
        const body = await response.text();
        if (!response.ok) {
          throw new Error(
            `Wayback CDX HTTP ${response.status}: ${body.slice(0, ERROR_PREVIEW_MAX_CHARS)}`
          );
        }
        const parsed = JSON.parse(body) as unknown;
        if (!Array.isArray(parsed) || parsed.length === 0) {
          return { snapshots: [] };
        }
        const header = parsed[0] as string[];
        const rows = parsed.slice(1).map((row) => {
          const values = row as string[];
          const item: Record<string, unknown> = {};
          for (let index = 0; index < header.length; index += 1) {
            item[header[index]] = values[index] ?? "";
          }
          if (typeof item.timestamp === "string" && typeof item.original === "string") {
            item.snapshotUrl = `https://web.archive.org/web/${item.timestamp}/${item.original}`;
          }
          return item;
        });
        return {
          query: Object.fromEntries(query.entries()),
          snapshots: rows,
        };
      })
  );

  server.registerTool(
    "jina_fetch_url",
    {
      description:
        "Fetch web content through r.jina.ai for pages that are difficult to scrape directly.",
      inputSchema: {
        url: z.string().min(1).describe("Target URL (http/https)"),
        maxChars: z
          .number()
          .int()
          .min(JINA_MIN_MAX_CHARS)
          .max(JINA_MAX_MAX_CHARS)
          .optional()
          .describe(`Maximum returned characters (default: ${JINA_DEFAULT_MAX_CHARS})`),
      },
    },
    async (input) =>
      runValidatedTool(jinaFetchUrlInputSchema, input, async (validated) => {
        const normalizedUrl = /^https?:\/\//i.test(validated.url)
          ? validated.url
          : `https://${validated.url}`;
        const proxyUrl = `https://r.jina.ai/${normalizedUrl}`;
        const response = await fetchWithTimeout(proxyUrl, undefined, JINA_TIMEOUT_MS);
        const body = await response.text();
        if (!response.ok) {
          throw new Error(`r.jina.ai HTTP ${response.status}: ${body.slice(0, ERROR_PREVIEW_MAX_CHARS)}`);
        }
        const clipped = body.slice(0, validated.maxChars ?? JINA_DEFAULT_MAX_CHARS);
        return {
          sourceUrl: normalizedUrl,
          proxyUrl,
          text: clipped,
          truncated: body.length > clipped.length,
        };
      })
  );

  server.registerTool(
    "twstalker_profile_lookup",
    {
      description:
        "Fetch a Twstalker profile via r.jina.ai and extract recent post snippets without an API key.",
      inputSchema: {
        username: z
          .string()
          .min(1)
          .describe("Twstalker username, @username, or full twstalker.com profile URL"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(TWSTALKER_MAX_LIMIT)
          .optional()
          .describe(`Maximum number of post snippets to return (default: ${TWSTALKER_DEFAULT_LIMIT})`),
      },
    },
    async (input) =>
      runValidatedTool(twstalkerProfileLookupInputSchema, input, async (validated) =>
        twstalkerProfileLookupUseCase.execute({
          username: validated.username,
          limit: validated.limit,
        })
      )
  );

  server.registerTool(
    "capsolver_create_and_poll",
    {
      description:
        "Create a CapSolver task and poll until completion. API key is required as an argument.",
      inputSchema: {
        apiKey: z.string().min(1).describe("CapSolver API key"),
        task: z
          .record(z.string(), z.unknown())
          .describe("CapSolver task object, e.g. ReCaptchaV2TaskProxyLess"),
        timeoutMs: z
          .number()
          .int()
          .min(CAPSOLVER_MIN_POLL_TIMEOUT_MS)
          .max(CAPSOLVER_MAX_POLL_TIMEOUT_MS)
          .optional()
          .describe(
            `Polling timeout in milliseconds (default: ${CAPSOLVER_DEFAULT_POLL_TIMEOUT_MS})`
          ),
        pollIntervalMs: z
          .number()
          .int()
          .min(CAPSOLVER_MIN_POLL_INTERVAL_MS)
          .max(CAPSOLVER_MAX_POLL_INTERVAL_MS)
          .optional()
          .describe(
            `Polling interval in milliseconds (default: ${CAPSOLVER_DEFAULT_POLL_INTERVAL_MS})`
          ),
      },
    },
    async (input) =>
      runValidatedTool(capsolverCreateAndPollInputSchema, input, async (validated) => {
        const createResponse = await fetchWithTimeout(
          "https://api.capsolver.com/createTask",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientKey: validated.apiKey,
              task: validated.task,
            }),
          },
          CAPSOLVER_TIMEOUT_MS
        );
        const createJson = (await createResponse.json()) as Record<string, unknown>;
        if (!createResponse.ok) {
          throw new Error(
            `CapSolver createTask HTTP ${createResponse.status}: ${JSON.stringify(createJson)}`
          );
        }
        if ((createJson.errorId as number | undefined) && (createJson.errorId as number) !== 0) {
          throw new Error(`CapSolver createTask error: ${JSON.stringify(createJson)}`);
        }

        const taskId = String(createJson.taskId ?? "");
        if (!taskId) {
          throw new Error(`CapSolver createTask returned no taskId: ${JSON.stringify(createJson)}`);
        }

        const startedAt = Date.now();
        const maxWait = validated.timeoutMs ?? CAPSOLVER_DEFAULT_POLL_TIMEOUT_MS;
        const interval = validated.pollIntervalMs ?? CAPSOLVER_DEFAULT_POLL_INTERVAL_MS;

        while (Date.now() - startedAt < maxWait) {
          await sleep(interval);
          const pollResponse = await fetchWithTimeout(
            "https://api.capsolver.com/getTaskResult",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clientKey: validated.apiKey,
                taskId,
              }),
            },
            CAPSOLVER_TIMEOUT_MS
          );
          const pollJson = (await pollResponse.json()) as Record<string, unknown>;
          if (!pollResponse.ok) {
            throw new Error(
              `CapSolver getTaskResult HTTP ${pollResponse.status}: ${JSON.stringify(pollJson)}`
            );
          }
          if ((pollJson.errorId as number | undefined) && (pollJson.errorId as number) !== 0) {
            throw new Error(`CapSolver polling error: ${JSON.stringify(pollJson)}`);
          }

          const status = String(pollJson.status ?? "");
          if (status.toLowerCase() === "ready") {
            return {
              taskId,
              status,
              result: pollJson.solution ?? pollJson,
            };
          }
          if (status.toLowerCase() === "failed") {
            throw new Error(`CapSolver task failed: ${JSON.stringify(pollJson)}`);
          }
        }
        throw new Error(`CapSolver polling timed out after ${maxWait}ms`);
      })
  );
}
