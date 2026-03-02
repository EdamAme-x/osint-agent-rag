import {
  DUCKDUCKGO_DEFAULT_LIMIT,
} from "../../config/constants.js";
import { parseDuckduckgoApiResponse } from "../../domain/duckduckgo/parseDuckduckgoApiResponse.js";
import type { DuckduckgoApiResponse, DuckduckgoSearchHit } from "../../domain/duckduckgo/types.js";

export interface DuckduckgoSearchGateway {
  fetchSearchResponse(input: { query: string }): Promise<DuckduckgoApiResponse>;
}

export type DuckduckgoSearchInput = {
  query: string;
  limit?: number;
};

export type DuckduckgoSearchOutput = {
  query: string;
  resultCount: number;
  results: DuckduckgoSearchHit[];
};

export function createDuckduckgoSearchUseCase(gateway: DuckduckgoSearchGateway) {
  return {
    async execute(input: DuckduckgoSearchInput): Promise<DuckduckgoSearchOutput> {
      const effectiveLimit = input.limit ?? DUCKDUCKGO_DEFAULT_LIMIT;
      const response = await gateway.fetchSearchResponse({ query: input.query });
      const results = parseDuckduckgoApiResponse(response, effectiveLimit);
      return {
        query: input.query,
        resultCount: results.length,
        results,
      };
    },
  };
}
