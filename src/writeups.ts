import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type WriteupDoc = {
  absPath: string;
  relPath: string;
  series?: string;
  category?: string;
  challenge?: string;
  title: string;
  text: string;
  normalizedText: string;
  normalizedTitle: string;
  normalizedPath: string;
};

export type SearchFilters = {
  series?: string;
  category?: string;
  pathContains?: string;
};

export type SearchResult = {
  score: number;
  relPath: string;
  title: string;
  series?: string;
  category?: string;
  challenge?: string;
  snippet: string;
};

export type DomainCount = {
  domain: string;
  count: number;
};

const URL_PATTERN = /https?:\/\/[^\s)\]>'"`]+/gi;
const SNIPPET_FALLBACK_LENGTH = 260;
const SNIPPET_CONTEXT_BEFORE = 110;
const SNIPPET_CONTEXT_AFTER = 170;
const SERIES_MIN_PARTS = 4;
const PHRASE_MIN_LENGTH = 2;
const SCORE_PHRASE_TITLE = 40;
const SCORE_PHRASE_PATH = 30;
const SCORE_PHRASE_TEXT = 20;
const SCORE_TOKEN_TITLE = 14;
const SCORE_TOKEN_PATH = 10;
const SCORE_TOKEN_ALL_MATCH_BONUS = 10;
const SCORE_TOKEN_BODY_HIT_CAP = 20;

function normalize(input: string): string {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokenise(input: string): string[] {
  return normalize(input)
    .split(/[^a-z0-9_.-]+/i)
    .map((token) => token.trim())
    .filter(Boolean);
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) {
    return 0;
  }
  let count = 0;
  let start = 0;
  while (start < haystack.length) {
    const index = haystack.indexOf(needle, start);
    if (index < 0) {
      break;
    }
    count += 1;
    start = index + needle.length;
  }
  return count;
}

function buildSnippet(doc: WriteupDoc, query: string): string {
  const normalizedQuery = normalize(query);
  const normalizedDoc = doc.normalizedText;
  let matchIndex = normalizedDoc.indexOf(normalizedQuery);
  if (matchIndex < 0) {
    for (const token of tokenise(query)) {
      matchIndex = normalizedDoc.indexOf(token);
      if (matchIndex >= 0) {
        break;
      }
    }
  }
  if (matchIndex < 0) {
    return doc.text.replace(/\s+/g, " ").slice(0, SNIPPET_FALLBACK_LENGTH).trim();
  }
  const start = Math.max(0, matchIndex - SNIPPET_CONTEXT_BEFORE);
  const end = Math.min(doc.text.length, matchIndex + SNIPPET_CONTEXT_AFTER);
  const body = doc.text.slice(start, end).replace(/\s+/g, " ").trim();
  const prefix = start > 0 ? "... " : "";
  const suffix = end < doc.text.length ? " ..." : "";
  return `${prefix}${body}${suffix}`;
}

async function listRecursively(dir: string): Promise<string[]> {
  const children = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    children.map(async (child) => {
      const target = path.join(dir, child.name);
      if (child.isDirectory()) {
        return listRecursively(target);
      }
      return [target];
    })
  );
  return nested.flat();
}

function extractMetadata(root: string, absPath: string) {
  const rel = path.relative(root, absPath);
  const parts = rel.split(path.sep);
  const isSeriesFile = parts.length >= SERIES_MIN_PARTS;
  const series = isSeriesFile ? parts[0] : undefined;
  const category = isSeriesFile ? parts[1] : undefined;
  const challenge = isSeriesFile ? parts[2] : undefined;
  return {
    relPath: path.join("writeups", rel).replaceAll(path.sep, "/"),
    series,
    category,
    challenge,
  };
}

function extractTitle(text: string, fallback: string): string {
  const heading = text.match(/^#\s+(.+)$/m);
  return heading?.[1]?.trim() || fallback;
}

export async function loadWriteups(writeupsRoot: string): Promise<WriteupDoc[]> {
  const allFiles = await listRecursively(writeupsRoot);
  const readmeFiles = allFiles.filter(
    (file) => path.basename(file).toLowerCase() === "readme.md"
  );

  const docs = await Promise.all(
    readmeFiles.map(async (absPath) => {
      const text = await readFile(absPath, "utf8");
      const meta = extractMetadata(writeupsRoot, absPath);
      const title = extractTitle(text, meta.challenge ?? meta.relPath);
      return {
        absPath,
        relPath: meta.relPath,
        series: meta.series,
        category: meta.category,
        challenge: meta.challenge,
        title,
        text,
        normalizedText: normalize(text),
        normalizedTitle: normalize(title),
        normalizedPath: normalize(meta.relPath),
      } satisfies WriteupDoc;
    })
  );

  return docs.sort((a, b) => a.relPath.localeCompare(b.relPath));
}

function scoreDoc(doc: WriteupDoc, query: string): number {
  const tokens = tokenise(query);
  if (tokens.length === 0) {
    return 0;
  }

  let score = 0;
  const phrase = normalize(query);
  if (phrase.length > PHRASE_MIN_LENGTH) {
    if (doc.normalizedTitle.includes(phrase)) {
      score += SCORE_PHRASE_TITLE;
    }
    if (doc.normalizedPath.includes(phrase)) {
      score += SCORE_PHRASE_PATH;
    }
    if (doc.normalizedText.includes(phrase)) {
      score += SCORE_PHRASE_TEXT;
    }
  }

  for (const token of tokens) {
    const titleHits = countOccurrences(doc.normalizedTitle, token);
    const pathHits = countOccurrences(doc.normalizedPath, token);
    const bodyHits = countOccurrences(doc.normalizedText, token);
    score += titleHits * SCORE_TOKEN_TITLE;
    score += pathHits * SCORE_TOKEN_PATH;
    score += Math.min(bodyHits, SCORE_TOKEN_BODY_HIT_CAP);
  }

  const matchedTokenCount = tokens.filter((token) =>
    doc.normalizedText.includes(token)
  ).length;
  if (matchedTokenCount === tokens.length) {
    score += SCORE_TOKEN_ALL_MATCH_BONUS;
  }

  return score;
}

function matchesFilters(doc: WriteupDoc, filters: SearchFilters): boolean {
  if (filters.series && doc.series !== filters.series) {
    return false;
  }
  if (filters.category && doc.category !== filters.category) {
    return false;
  }
  if (
    filters.pathContains &&
    !doc.relPath.toLowerCase().includes(filters.pathContains.toLowerCase())
  ) {
    return false;
  }
  return true;
}

export function searchWriteups(
  docs: WriteupDoc[],
  query: string,
  limit: number,
  filters: SearchFilters = {}
): SearchResult[] {
  return docs
    .filter((doc) => matchesFilters(doc, filters))
    .map((doc) => ({
      doc,
      score: scoreDoc(doc, query),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ doc, score }) => ({
      score,
      relPath: doc.relPath,
      title: doc.title,
      series: doc.series,
      category: doc.category,
      challenge: doc.challenge,
      snippet: buildSnippet(doc, query),
    }));
}

export function collectTopDomains(
  docs: WriteupDoc[],
  limit: number
): DomainCount[] {
  const domainCounts = new Map<string, number>();
  for (const doc of docs) {
    const urls = doc.text.match(URL_PATTERN) ?? [];
    for (const url of urls) {
      try {
        const parsed = new URL(url);
        const domain = parsed.hostname.toLowerCase();
        domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
      } catch {
        // Ignore malformed URLs.
      }
    }
  }
  return [...domainCounts.entries()]
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
