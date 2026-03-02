import {
  MEDIA_DEFAULT_DOWNLOAD_TIMEOUT_MS,
  MEDIA_DEFAULT_MAX_DOWNLOAD_BYTES,
} from "../../config/constants.js";

export type ExtractMediaMetadataInput = {
  filePath?: string;
  url?: string;
  maxDownloadBytes?: number;
  downloadTimeoutMs?: number;
};

export interface MediaMetadataGateway {
  extract(input: {
    filePath?: string;
    url?: string;
    maxDownloadBytes: number;
    downloadTimeoutMs: number;
  }): Promise<unknown>;
}

export function createExtractMediaMetadataUseCase(gateway: MediaMetadataGateway) {
  return {
    async execute(input: ExtractMediaMetadataInput) {
      if (!input.filePath && !input.url) {
        throw new Error("filePath or url is required");
      }
      return gateway.extract({
        filePath: input.filePath,
        url: input.url,
        maxDownloadBytes: input.maxDownloadBytes ?? MEDIA_DEFAULT_MAX_DOWNLOAD_BYTES,
        downloadTimeoutMs: input.downloadTimeoutMs ?? MEDIA_DEFAULT_DOWNLOAD_TIMEOUT_MS,
      });
    },
  };
}
