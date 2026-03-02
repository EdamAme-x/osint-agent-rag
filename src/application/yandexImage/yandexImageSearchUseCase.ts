import { parseYandexImageSearchHtml } from "../../domain/yandexImage/parseYandexImageSearchHtml.js";
import type { YandexImageHit } from "../../domain/yandexImage/types.js";
import { YANDEX_IMAGE_DEFAULT_LIMIT } from "../../config/constants.js";

export interface YandexImageSearchGateway {
  fetchSearchPage(input: { query: string; lr?: number }): Promise<{
    searchUrl: string;
    html: string;
  }>;
}

export type YandexImageSearchInput = {
  query: string;
  limit?: number;
  lr?: number;
};

export type YandexImageSearchOutput = {
  query: string;
  searchUrl: string;
  resultCount: number;
  results: YandexImageHit[];
};

export function createYandexImageSearchUseCase(gateway: YandexImageSearchGateway) {
  return {
    async execute(input: YandexImageSearchInput): Promise<YandexImageSearchOutput> {
      const effectiveLimit = input.limit ?? YANDEX_IMAGE_DEFAULT_LIMIT;
      const page = await gateway.fetchSearchPage({
        query: input.query,
        lr: input.lr,
      });
      const results = parseYandexImageSearchHtml(page.html, effectiveLimit);
      return {
        query: input.query,
        searchUrl: page.searchUrl,
        resultCount: results.length,
        results,
      };
    },
  };
}
