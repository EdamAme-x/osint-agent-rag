import type { YandexImageHit } from "./types.js";

function decodeHtmlEntities(input: string): string {
  return input
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function toAbsoluteMaybeProtocolUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  if (value.startsWith("//")) {
    return `https:${value}`;
  }
  return value;
}

export function parseYandexImageSearchHtml(
  html: string,
  limit: number
): YandexImageHit[] {
  const states = [...html.matchAll(/data-state="([\s\S]*?)"/g)].map((match) => {
    const decoded = decodeHtmlEntities(match[1]);
    try {
      return JSON.parse(decoded) as unknown;
    } catch {
      return null;
    }
  });

  const hits: YandexImageHit[] = [];
  const seen = new Set<string>();

  const walk = (value: unknown) => {
    if (!value || typeof value !== "object") {
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item);
      }
      return;
    }

    const item = value as Record<string, unknown>;
    const origUrl = typeof item.origUrl === "string" ? item.origUrl : undefined;
    const viewerData =
      item.viewerData && typeof item.viewerData === "object"
        ? (item.viewerData as Record<string, unknown>)
        : undefined;
    const imgHref =
      viewerData && typeof viewerData.img_href === "string"
        ? (viewerData.img_href as string)
        : undefined;
    const fromSearchUrl =
      typeof item.url === "string" && item.url.startsWith("/images/search")
        ? (() => {
            try {
              const parsed = new URL(`https://yandex.com${item.url}`);
              return parsed.searchParams.get("img_url") ?? undefined;
            } catch {
              return undefined;
            }
          })()
        : undefined;

    const imageUrl = imgHref || origUrl || fromSearchUrl;
    const sourcePageUrl =
      viewerData &&
      viewerData.snippet &&
      typeof viewerData.snippet === "object" &&
      typeof (viewerData.snippet as Record<string, unknown>).url === "string"
        ? ((viewerData.snippet as Record<string, unknown>).url as string)
        : item.snippet &&
            typeof item.snippet === "object" &&
            typeof (item.snippet as Record<string, unknown>).url === "string"
          ? ((item.snippet as Record<string, unknown>).url as string)
          : undefined;

    if (imageUrl && !seen.has(imageUrl)) {
      seen.add(imageUrl);
      const title =
        typeof item.alt === "string"
          ? item.alt
          : viewerData &&
              viewerData.snippet &&
              typeof viewerData.snippet === "object" &&
              typeof (viewerData.snippet as Record<string, unknown>).title === "string"
            ? ((viewerData.snippet as Record<string, unknown>).title as string)
            : undefined;
      const thumbUrl =
        viewerData &&
        viewerData.thumb &&
        typeof viewerData.thumb === "object" &&
        typeof (viewerData.thumb as Record<string, unknown>).url === "string"
          ? ((viewerData.thumb as Record<string, unknown>).url as string)
          : typeof item.image === "string"
            ? item.image
            : undefined;
      const yandexResultUrl =
        typeof item.url === "string" && item.url.startsWith("/images/search")
          ? `https://yandex.com${item.url}`
          : undefined;

      hits.push({
        title,
        imageUrl: toAbsoluteMaybeProtocolUrl(imageUrl) ?? imageUrl,
        sourcePageUrl,
        yandexResultUrl,
        thumbnailUrl: toAbsoluteMaybeProtocolUrl(thumbUrl),
        width:
          typeof item.origWidth === "number"
            ? item.origWidth
            : typeof item.width === "number"
              ? item.width
              : undefined,
        height:
          typeof item.origHeight === "number"
            ? item.origHeight
            : typeof item.height === "number"
              ? item.height
              : undefined,
      });
    }

    for (const nested of Object.values(item)) {
      walk(nested);
    }
  };

  for (const state of states) {
    walk(state);
  }

  return hits.slice(0, limit);
}
