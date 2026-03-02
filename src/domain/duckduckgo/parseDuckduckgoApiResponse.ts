import type { DuckduckgoApiResponse, DuckduckgoApiTopic, DuckduckgoSearchHit } from "./types.js";

function decodeHtmlEntities(input: string): string {
  return input
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function stripHtmlTags(input: string): string {
  return decodeHtmlEntities(input.replaceAll(/<[^>]*>/g, " ")).replaceAll(/\s+/g, " ").trim();
}

function toAbsoluteIconUrl(iconUrl: string | undefined): string | undefined {
  if (!iconUrl) {
    return undefined;
  }
  if (iconUrl.startsWith("//")) {
    return `https:${iconUrl}`;
  }
  if (iconUrl.startsWith("/")) {
    return `https://duckduckgo.com${iconUrl}`;
  }
  return iconUrl;
}

function titleFromTopic(topic: DuckduckgoApiTopic): string {
  if (typeof topic.Text === "string" && topic.Text.trim().length > 0) {
    const text = topic.Text.trim();
    const separatorIndex = text.indexOf(" - ");
    if (separatorIndex > 0) {
      return text.slice(separatorIndex + 3).trim();
    }
    return text;
  }

  if (typeof topic.Result === "string" && topic.Result.trim().length > 0) {
    return stripHtmlTags(topic.Result);
  }
  return "";
}

function flattenTopics(topics: DuckduckgoApiTopic[]): DuckduckgoApiTopic[] {
  const flat: DuckduckgoApiTopic[] = [];

  const visit = (topic: DuckduckgoApiTopic) => {
    if (Array.isArray(topic.Topics) && topic.Topics.length > 0) {
      for (const nested of topic.Topics) {
        visit(nested);
      }
      return;
    }
    flat.push(topic);
  };

  for (const topic of topics) {
    visit(topic);
  }
  return flat;
}

export function parseDuckduckgoApiResponse(
  response: DuckduckgoApiResponse,
  limit: number
): DuckduckgoSearchHit[] {
  const hits: DuckduckgoSearchHit[] = [];
  const seen = new Set<string>();

  const addHit = (hit: DuckduckgoSearchHit) => {
    if (!hit.url || seen.has(hit.url)) {
      return;
    }
    seen.add(hit.url);
    hits.push(hit);
  };

  if (response.AbstractURL) {
    const abstractSnippet = response.AbstractText ?? response.Abstract;
    addHit({
      title: response.Heading?.trim() || response.AbstractURL,
      url: response.AbstractURL,
      snippet: typeof abstractSnippet === "string" ? abstractSnippet.trim() : undefined,
      source: "abstract",
    });
  }

  const directResults = Array.isArray(response.Results) ? response.Results : [];
  for (const item of directResults) {
    if (typeof item.FirstURL !== "string") {
      continue;
    }
    const title = titleFromTopic(item);
    addHit({
      title: title || item.FirstURL,
      url: item.FirstURL,
      snippet: typeof item.Text === "string" ? item.Text.trim() : undefined,
      iconUrl: toAbsoluteIconUrl(item.Icon?.URL),
      source: "results",
    });
  }

  const relatedTopics = Array.isArray(response.RelatedTopics) ? response.RelatedTopics : [];
  const flattened = flattenTopics(relatedTopics);
  for (const topic of flattened) {
    if (typeof topic.FirstURL !== "string") {
      continue;
    }
    const title = titleFromTopic(topic);
    addHit({
      title: title || topic.FirstURL,
      url: topic.FirstURL,
      snippet: typeof topic.Text === "string" ? topic.Text.trim() : undefined,
      iconUrl: toAbsoluteIconUrl(topic.Icon?.URL),
      source: "relatedTopics",
    });
  }

  return hits.slice(0, limit);
}
