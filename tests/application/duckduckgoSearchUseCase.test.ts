import { describe, expect, it, vi } from "vitest";
import { createDuckduckgoSearchUseCase } from "../../src/application/duckduckgo/duckduckgoSearchUseCase.js";
import * as parserModule from "../../src/domain/duckduckgo/parseDuckduckgoApiResponse.js";
import { DUCKDUCKGO_DEFAULT_LIMIT } from "../../src/config/constants.js";

describe("duckduckgoSearchUseCase", () => {
  it("uses gateway and parser with default limit (spy + mock)", async () => {
    const rawResponse = {
      AbstractURL: "https://example.com/abstract",
      Results: [
        {
          FirstURL: "https://example.com/result",
          Text: "Result text",
        },
      ],
    };
    const fetchSearchResponse = vi.fn().mockResolvedValue(rawResponse);
    const parserSpy = vi.spyOn(parserModule, "parseDuckduckgoApiResponse");

    const useCase = createDuckduckgoSearchUseCase({
      fetchSearchResponse,
    });
    const result = await useCase.execute({ query: "openai" });

    expect(fetchSearchResponse).toHaveBeenCalledWith({ query: "openai" });
    expect(parserSpy).toHaveBeenCalledWith(rawResponse, DUCKDUCKGO_DEFAULT_LIMIT);
    expect(result.query).toBe("openai");
    expect(result.resultCount).toBeGreaterThanOrEqual(1);
  });
});
