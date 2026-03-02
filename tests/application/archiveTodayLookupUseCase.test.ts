import { describe, expect, it, vi } from "vitest";
import { createArchiveTodayLookupUseCase } from "../../src/application/archive/archiveTodayLookupUseCase.js";
import * as archiveParser from "../../src/domain/archive/parseArchiveTimemap.js";

describe("archiveTodayLookupUseCase", () => {
  it("normalizes URL, parses timemap, sorts and limits mementos (mock + spy)", async () => {
    const timemap = [
      '<http://example.com/>; rel="original"',
      '<http://archive.md/timegate/http://example.com/>; rel="timegate"',
      '<http://archive.md/20250101000000/http://example.com/>; rel="memento"; datetime="Wed, 01 Jan 2025 00:00:00 GMT"',
      '<http://archive.md/20230101000000/http://example.com/>; rel="memento"; datetime="Sun, 01 Jan 2023 00:00:00 GMT"',
      '<http://archive.md/20240101000000/http://example.com/>; rel="memento"; datetime="Mon, 01 Jan 2024 00:00:00 GMT"',
    ].join(",\n");
    const fetchTimemap = vi.fn().mockResolvedValue(timemap);
    const parserSpy = vi.spyOn(archiveParser, "parseArchiveTimemap");

    const useCase = createArchiveTodayLookupUseCase({ fetchTimemap });
    const result = await useCase.execute({ url: "example.com", limit: 2 });

    expect(fetchTimemap).toHaveBeenCalledWith("https://example.com");
    expect(parserSpy).toHaveBeenCalled();
    expect(result.mementos).toHaveLength(2);
    expect(result.mementos[0].datetime).toBe("Sun, 01 Jan 2023 00:00:00 GMT");
    expect(result.mementos[1].datetime).toBe("Mon, 01 Jan 2024 00:00:00 GMT");
  });
});
