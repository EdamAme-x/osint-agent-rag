import { TWSTALKER_DEFAULT_LIMIT } from "../../config/constants.js";
import { parseTwstalkerProfileMarkdown } from "../../domain/twstalker/parseTwstalkerProfileMarkdown.js";
import type { TwstalkerPost } from "../../domain/twstalker/types.js";

export interface TwstalkerProfileGateway {
  fetchProfileMarkdown(input: {
    username: string;
  }): Promise<{
    profileUrl: string;
    proxyUrl: string;
    markdown: string;
  }>;
}

export type TwstalkerProfileLookupInput = {
  username: string;
  limit?: number;
};

export type TwstalkerProfileLookupOutput = {
  username: string;
  sourceUrl: string;
  proxyUrl: string;
  title?: string;
  profileImageUrl?: string;
  resultCount: number;
  isLikelyMissingProfile: boolean;
  results: TwstalkerPost[];
};

function normalizeUsername(input: string): string {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const segment = parsed.pathname.split("/").find((part) => part.trim().length > 0);
      if (segment) {
        return segment.replace(/^@+/, "").split(/[?#]/, 1)[0];
      }
    } catch {
      // Fall through and use a basic extraction strategy.
    }
  }

  const lastSegment =
    trimmed.split("/").filter((segment) => segment.trim().length > 0).at(-1) ?? trimmed;
  return lastSegment.replace(/^@+/, "").split(/[?#]/, 1)[0];
}

export function createTwstalkerProfileLookupUseCase(gateway: TwstalkerProfileGateway) {
  return {
    async execute(input: TwstalkerProfileLookupInput): Promise<TwstalkerProfileLookupOutput> {
      const normalizedUsername = normalizeUsername(input.username);
      const effectiveLimit = input.limit ?? TWSTALKER_DEFAULT_LIMIT;
      const page = await gateway.fetchProfileMarkdown({ username: normalizedUsername });
      const parsed = parseTwstalkerProfileMarkdown(page.markdown, effectiveLimit);

      return {
        username: normalizedUsername,
        sourceUrl: parsed.sourceUrl ?? page.profileUrl,
        proxyUrl: page.proxyUrl,
        title: parsed.title,
        profileImageUrl: parsed.profileImageUrl,
        resultCount: parsed.posts.length,
        isLikelyMissingProfile: parsed.isLikelyMissingProfile,
        results: parsed.posts,
      };
    },
  };
}
