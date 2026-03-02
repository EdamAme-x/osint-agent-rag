import { parseArchiveTimemap } from "../../domain/archive/parseArchiveTimemap.js";
import { ARCHIVE_DEFAULT_LIMIT } from "../../config/constants.js";

export interface ArchiveTodayGateway {
  fetchTimemap(url: string): Promise<string>;
}

export type ArchiveTodayLookupInput = {
  url: string;
  limit?: number;
};

export function createArchiveTodayLookupUseCase(gateway: ArchiveTodayGateway) {
  return {
    async execute(input: ArchiveTodayLookupInput) {
      const normalized = /^https?:\/\//i.test(input.url)
        ? input.url
        : `https://${input.url}`;
      const timemap = await gateway.fetchTimemap(normalized);
      const parsed = parseArchiveTimemap(timemap);
      const sorted = parsed.mementos
        .sort((a, b) => {
          const aTime = Date.parse(a.datetime ?? "");
          const bTime = Date.parse(b.datetime ?? "");
          return aTime - bTime;
        })
        .slice(0, input.limit ?? ARCHIVE_DEFAULT_LIMIT);
      return {
        original: parsed.original,
        timegate: parsed.timegate,
        totalMementos: parsed.mementos.length,
        firstMemento: parsed.mementos[0] ?? null,
        latestMemento: parsed.mementos[parsed.mementos.length - 1] ?? null,
        mementos: sorted,
      };
    },
  };
}
