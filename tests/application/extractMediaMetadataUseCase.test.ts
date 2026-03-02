import { describe, expect, it, vi } from "vitest";
import { createExtractMediaMetadataUseCase } from "../../src/application/media/extractMediaMetadataUseCase.js";
import {
  MEDIA_DEFAULT_DOWNLOAD_TIMEOUT_MS,
  MEDIA_DEFAULT_MAX_DOWNLOAD_BYTES,
} from "../../src/config/constants.js";

describe("extractMediaMetadataUseCase", () => {
  it("applies default download options (spy)", async () => {
    const gateway = {
      extract: async (_input: {
        filePath?: string;
        url?: string;
        maxDownloadBytes: number;
        downloadTimeoutMs: number;
      }) => ({ ok: true }),
    };
    const extractSpy = vi.spyOn(gateway, "extract");
    const useCase = createExtractMediaMetadataUseCase(gateway);

    await useCase.execute({ url: "https://example.com/image.jpg" });

    expect(extractSpy).toHaveBeenCalledWith({
      filePath: undefined,
      url: "https://example.com/image.jpg",
      maxDownloadBytes: MEDIA_DEFAULT_MAX_DOWNLOAD_BYTES,
      downloadTimeoutMs: MEDIA_DEFAULT_DOWNLOAD_TIMEOUT_MS,
    });
  });
});
