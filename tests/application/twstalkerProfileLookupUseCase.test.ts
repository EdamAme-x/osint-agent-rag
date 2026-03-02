import { describe, expect, it, vi } from "vitest";
import { createTwstalkerProfileLookupUseCase } from "../../src/application/twstalker/twstalkerProfileLookupUseCase.js";
import * as parserModule from "../../src/domain/twstalker/parseTwstalkerProfileMarkdown.js";
import { TWSTALKER_DEFAULT_LIMIT } from "../../src/config/constants.js";

describe("twstalkerProfileLookupUseCase", () => {
  it("normalizes username and calls gateway/parser with default limit (mock + spy)", async () => {
    const markdown = [
      "Title: TwStalker - Twitter Search Web Viewer",
      "URL Source: https://twstalker.com/jack",
      "",
      "Markdown Content:",
      "[![Image 1: jack Profile Picture](https://pbs.twimg.com/profile_images/jack.jpg)](https://twstalker.com/jack)",
      "",
      "hello from twstalker",
    ].join("\n");

    const fetchProfileMarkdown = vi.fn().mockResolvedValue({
      profileUrl: "https://twstalker.com/jack",
      proxyUrl: "https://r.jina.ai/https://twstalker.com/jack",
      markdown,
    });
    const parserSpy = vi.spyOn(parserModule, "parseTwstalkerProfileMarkdown");

    const useCase = createTwstalkerProfileLookupUseCase({ fetchProfileMarkdown });
    const result = await useCase.execute({
      username: "https://twstalker.com/jack",
    });

    expect(fetchProfileMarkdown).toHaveBeenCalledWith({ username: "jack" });
    expect(parserSpy).toHaveBeenCalledWith(markdown, TWSTALKER_DEFAULT_LIMIT);
    expect(result.username).toBe("jack");
    expect(result.resultCount).toBe(1);
    expect(result.results[0].text).toBe("hello from twstalker");
  });
});
