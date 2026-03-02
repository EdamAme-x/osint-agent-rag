import type { ParsedTwstalkerProfileMarkdown, TwstalkerPost } from "./types.js";

const TITLE_PREFIX = "Title:";
const URL_SOURCE_PREFIX = "URL Source:";
const MARKDOWN_CONTENT_PREFIX = "Markdown Content:";
const RETWEET_LINE_REGEX = /^_([^_]+?)\s+retweeted_$/i;
const IMAGE_LINE_REGEX = /^\[!\[(.*?)\]\((https?:\/\/[^)\s]+)\)\]\((https?:\/\/[^)\s]+)\)\s*$/i;
const PROFILE_LINK_REGEX = /^https?:\/\/twstalker\.com\/([^/?#]+)\/?$/i;
const SECTION_END_HEADING_REGEX = /^###\s+(Trends for|You might like)/i;
const PROFILE_CARD_TITLE_PREFIX = "[#### ";
const FOLLOWERS_FOLLOWING_LINE_REGEX = /\bFollowers\b.*\bFollowing\b/i;
const PROFILE_PICTURE_TOKEN = "profile picture";
const MISSING_PROFILE_MARKER = "twstalker is not affiliated with x";

type PostBuilder = {
  authorHandle?: string;
  authorProfileUrl?: string;
  authorProfileImageUrl?: string;
  retweetedBy?: string;
  mediaUrls: string[];
  textLines: string[];
};

function parseHeaderValue(markdown: string, prefix: string): string | undefined {
  const lines = markdown.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith(prefix)) {
      const value = line.slice(prefix.length).trim();
      if (value.length > 0) {
        return value;
      }
      return undefined;
    }
  }
  return undefined;
}

function extractMarkdownContent(markdown: string): string {
  const contentStart = markdown.indexOf(MARKDOWN_CONTENT_PREFIX);
  if (contentStart < 0) {
    return markdown;
  }
  return markdown.slice(contentStart + MARKDOWN_CONTENT_PREFIX.length);
}

function normalizeText(input: string): string {
  return input.replaceAll(/\s+/g, " ").trim();
}

function normalizeRetweeter(input: string): string {
  return input.trim().replace(/^@+/, "");
}

function extractHandleFromProfileUrl(url: string): string | undefined {
  const match = url.match(PROFILE_LINK_REGEX);
  if (!match) {
    return undefined;
  }
  return match[1];
}

export function parseTwstalkerProfileMarkdown(
  markdown: string,
  limit: number
): ParsedTwstalkerProfileMarkdown {
  const title = parseHeaderValue(markdown, TITLE_PREFIX);
  const sourceUrl = parseHeaderValue(markdown, URL_SOURCE_PREFIX);
  const content = extractMarkdownContent(markdown);
  const lines = content.split(/\r?\n/);

  const seen = new Set<string>();
  const posts: TwstalkerPost[] = [];
  let pendingRetweetedBy: string | undefined;
  let profileImageUrl: string | undefined;
  let current: PostBuilder | undefined;

  const commitCurrent = () => {
    if (!current) {
      return;
    }
    const text = normalizeText(current.textLines.join(" "));
    if (text.length === 0) {
      current = undefined;
      return;
    }

    const dedupeKey = `${current.authorHandle ?? ""}:${text}`;
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      posts.push({
        text,
        authorHandle: current.authorHandle,
        authorProfileUrl: current.authorProfileUrl,
        authorProfileImageUrl: current.authorProfileImageUrl,
        retweetedBy: current.retweetedBy,
        mediaUrls: current.mediaUrls,
      });
    }

    current = undefined;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0) {
      continue;
    }

    if (SECTION_END_HEADING_REGEX.test(line)) {
      break;
    }

    const retweetMatch = line.match(RETWEET_LINE_REGEX);
    if (retweetMatch) {
      pendingRetweetedBy = normalizeRetweeter(retweetMatch[1]);
      continue;
    }

    const imageMatch = line.match(IMAGE_LINE_REGEX);
    if (imageMatch) {
      const altText = imageMatch[1];
      const imageUrl = imageMatch[2];
      const targetUrl = imageMatch[3];
      const handleFromUrl = extractHandleFromProfileUrl(targetUrl);
      const isProfileImage =
        altText.toLowerCase().includes(PROFILE_PICTURE_TOKEN) && typeof handleFromUrl === "string";

      if (isProfileImage) {
        commitCurrent();
        current = {
          authorHandle: handleFromUrl,
          authorProfileUrl: targetUrl,
          authorProfileImageUrl: imageUrl,
          retweetedBy: pendingRetweetedBy,
          mediaUrls: [],
          textLines: [],
        };
        pendingRetweetedBy = undefined;
        if (!profileImageUrl) {
          profileImageUrl = imageUrl;
        }
        continue;
      }

      if (current && !current.mediaUrls.includes(imageUrl)) {
        current.mediaUrls.push(imageUrl);
      }
      continue;
    }

    if (line.startsWith(PROFILE_CARD_TITLE_PREFIX)) {
      continue;
    }
    if (FOLLOWERS_FOLLOWING_LINE_REGEX.test(line)) {
      continue;
    }
    if (!current) {
      continue;
    }

    current.textLines.push(line);
  }

  commitCurrent();

  return {
    title,
    sourceUrl,
    profileImageUrl,
    isLikelyMissingProfile:
      posts.length === 0 && markdown.toLowerCase().includes(MISSING_PROFILE_MARKER),
    posts: posts.slice(0, limit),
  };
}
