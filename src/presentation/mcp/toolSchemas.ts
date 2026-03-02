import * as v from "valibot";
import {
  ARCHIVE_MAX_LIMIT,
  CAPSOLVER_MAX_POLL_INTERVAL_MS,
  CAPSOLVER_MAX_POLL_TIMEOUT_MS,
  CAPSOLVER_MIN_POLL_INTERVAL_MS,
  CAPSOLVER_MIN_POLL_TIMEOUT_MS,
  DUCKDUCKGO_MAX_LIMIT,
  DOMAIN_LIST_MAX_LIMIT,
  DOMAIN_RECON_MAX_CERT_LIMIT,
  JINA_MAX_MAX_CHARS,
  JINA_MIN_MAX_CHARS,
  MEDIA_MAX_DOWNLOAD_TIMEOUT_MS,
  MEDIA_MAX_MAX_DOWNLOAD_BYTES,
  MEDIA_MIN_DOWNLOAD_TIMEOUT_MS,
  MEDIA_MIN_MAX_DOWNLOAD_BYTES,
  TWSTALKER_MAX_LIMIT,
  WAYBACK_MAX_LIMIT,
  WRITEUP_SEARCH_MAX_LIMIT,
  YANDEX_IMAGE_MAX_LIMIT,
} from "@/config/constants";

const nonEmptyString = () => v.pipe(v.string(), v.trim(), v.minLength(1));

const intRange = (min: number, max: number) =>
  v.pipe(v.number(), v.integer(), v.minValue(min), v.maxValue(max));

export const searchPastWriteupsInputSchema = v.object({
  query: nonEmptyString(),
  limit: v.optional(intRange(1, WRITEUP_SEARCH_MAX_LIMIT)),
  series: v.optional(v.string()),
  category: v.optional(v.string()),
  pathContains: v.optional(v.string()),
});

export const listFrequentDomainsInputSchema = v.object({
  limit: v.optional(intRange(1, DOMAIN_LIST_MAX_LIMIT)),
});

export const duckduckgoSearchInputSchema = v.object({
  query: nonEmptyString(),
  limit: v.optional(intRange(1, DUCKDUCKGO_MAX_LIMIT)),
});

export const yandexImageSearchInputSchema = v.object({
  query: nonEmptyString(),
  limit: v.optional(intRange(1, YANDEX_IMAGE_MAX_LIMIT)),
  lr: v.optional(v.pipe(v.number(), v.integer())),
});

export const archiveTodayLookupInputSchema = v.object({
  url: nonEmptyString(),
  limit: v.optional(intRange(1, ARCHIVE_MAX_LIMIT)),
});

export const domainReconBundleInputSchema = v.object({
  target: nonEmptyString(),
  certLimit: v.optional(intRange(1, DOMAIN_RECON_MAX_CERT_LIMIT)),
  shodanApiKey: v.optional(v.string()),
});

export const extractMetadataFromMediaInputSchema = v.pipe(
  v.object({
    filePath: v.optional(v.string()),
    url: v.optional(v.string()),
    maxDownloadBytes: v.optional(intRange(MEDIA_MIN_MAX_DOWNLOAD_BYTES, MEDIA_MAX_MAX_DOWNLOAD_BYTES)),
    downloadTimeoutMs: v.optional(intRange(MEDIA_MIN_DOWNLOAD_TIMEOUT_MS, MEDIA_MAX_DOWNLOAD_TIMEOUT_MS)),
  }),
  v.check(
    (input) =>
      (typeof input.filePath === "string" && input.filePath.trim().length > 0) ||
      (typeof input.url === "string" && input.url.trim().length > 0),
    "Either filePath or url must be provided"
  )
);

export const waybackCdxLookupInputSchema = v.object({
  url: nonEmptyString(),
  from: v.optional(v.string()),
  to: v.optional(v.string()),
  limit: v.optional(intRange(1, WAYBACK_MAX_LIMIT)),
});

export const jinaFetchUrlInputSchema = v.object({
  url: nonEmptyString(),
  maxChars: v.optional(intRange(JINA_MIN_MAX_CHARS, JINA_MAX_MAX_CHARS)),
});

export const twstalkerProfileLookupInputSchema = v.object({
  username: nonEmptyString(),
  limit: v.optional(intRange(1, TWSTALKER_MAX_LIMIT)),
});

export const capsolverCreateAndPollInputSchema = v.object({
  apiKey: nonEmptyString(),
  task: v.record(v.string(), v.unknown()),
  timeoutMs: v.optional(intRange(CAPSOLVER_MIN_POLL_TIMEOUT_MS, CAPSOLVER_MAX_POLL_TIMEOUT_MS)),
  pollIntervalMs: v.optional(
    intRange(CAPSOLVER_MIN_POLL_INTERVAL_MS, CAPSOLVER_MAX_POLL_INTERVAL_MS)
  ),
});
