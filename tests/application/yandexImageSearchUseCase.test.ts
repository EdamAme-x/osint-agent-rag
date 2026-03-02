import { describe, expect, it, vi } from "vitest";
import { createYandexImageSearchUseCase } from "../../src/application/yandexImage/yandexImageSearchUseCase.js";
import * as yandexParser from "../../src/domain/yandexImage/parseYandexImageSearchHtml.js";
import { YANDEX_IMAGE_DEFAULT_LIMIT } from "../../src/config/constants.js";

describe("yandexImageSearchUseCase", () => {
  it("uses gateway and parser with default limit (spy + mock)", async () => {
    const html = `<div data-state="{&quot;origUrl&quot;:&quot;https://img.example/a.jpg&quot;,&quot;alt&quot;:&quot;Tokyo Tower&quot;,&quot;url&quot;:&quot;/images/search?img_url=https%3A%2F%2Fimg.example%2Fa.jpg&quot;,&quot;snippet&quot;:{&quot;url&quot;:&quot;https://site.example/p&quot;}}"></div>`;
    const fetchSearchPage = vi.fn().mockResolvedValue({
      searchUrl: "https://yandex.com/images/search?text=tokyo+tower",
      html,
    });
    const parserSpy = vi.spyOn(yandexParser, "parseYandexImageSearchHtml");

    const useCase = createYandexImageSearchUseCase({
      fetchSearchPage,
    });
    const result = await useCase.execute({ query: "tokyo tower" });

    expect(fetchSearchPage).toHaveBeenCalledWith({ query: "tokyo tower", lr: undefined });
    expect(parserSpy).toHaveBeenCalledWith(html, YANDEX_IMAGE_DEFAULT_LIMIT);
    expect(result.resultCount).toBe(1);
    expect(result.results[0].imageUrl).toBe("https://img.example/a.jpg");
  });
});
