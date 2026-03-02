import os from "node:os";
import path from "node:path";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import * as exifr from "exifr";
import { fetchWithTimeout } from "../http/fetchWithTimeout.js";
import { runCommand } from "../common/runCommand.js";
import { ERROR_PREVIEW_MAX_CHARS } from "../../config/constants.js";

export const metadataExtractor = {
  async extract(input: {
    filePath?: string;
    url?: string;
    maxDownloadBytes: number;
    downloadTimeoutMs: number;
  }) {
    let workingFilePath = input.filePath;
    let tempDirPath: string | undefined;

    try {
      if (!workingFilePath && input.url) {
        const response = await fetchWithTimeout(input.url, undefined, input.downloadTimeoutMs);
        if (!response.ok) {
          return { error: `Download failed: HTTP ${response.status}` };
        }
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength > input.maxDownloadBytes) {
          return {
            error: `Downloaded file too large (${bytes.byteLength} bytes > ${input.maxDownloadBytes})`,
          };
        }
        tempDirPath = await mkdtemp(path.join(os.tmpdir(), "osint-agent-rag-media-"));
        const fileName = (() => {
          try {
            const parsed = new URL(input.url);
            return path.basename(parsed.pathname) || "downloaded-media.bin";
          } catch {
            return "downloaded-media.bin";
          }
        })();
        workingFilePath = path.join(tempDirPath, fileName);
        await writeFile(workingFilePath, Buffer.from(bytes));
      }

      if (!workingFilePath) {
        return { error: "Either filePath or url must be provided" };
      }

      const fileStat = await stat(workingFilePath);

      const exiftoolResult = await runCommand("exiftool", [
        "-json",
        "-G",
        "-n",
        workingFilePath,
      ]);
      let exiftoolJson: unknown = undefined;
      if (exiftoolResult.ok) {
        try {
          const parsed = JSON.parse(exiftoolResult.stdout) as unknown[];
          exiftoolJson = parsed[0] ?? null;
        } catch {
          exiftoolJson = {
            parseError: "Failed to parse exiftool JSON output",
            stdoutPreview: exiftoolResult.stdout.slice(0, ERROR_PREVIEW_MAX_CHARS),
          };
        }
      }

      const ffprobeResult = await runCommand("ffprobe", [
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        workingFilePath,
      ]);
      let ffprobeJson: unknown = undefined;
      if (ffprobeResult.ok) {
        try {
          ffprobeJson = JSON.parse(ffprobeResult.stdout);
        } catch {
          ffprobeJson = {
            parseError: "Failed to parse ffprobe JSON output",
            stdoutPreview: ffprobeResult.stdout.slice(0, ERROR_PREVIEW_MAX_CHARS),
          };
        }
      }

      let exifrJson: unknown = undefined;
      try {
        exifrJson = await exifr.parse(workingFilePath, {
          tiff: true,
          exif: true,
          gps: true,
          xmp: true,
          iptc: true,
        });
      } catch {
        exifrJson = null;
      }

      return {
        filePath: workingFilePath,
        fileSizeBytes: fileStat.size,
        tools: {
          exiftool: exiftoolResult.ok ? "ok" : exiftoolResult.error,
          ffprobe: ffprobeResult.ok ? "ok" : ffprobeResult.error,
          exifr: exifrJson ? "ok" : "no metadata / unsupported",
        },
        metadata: {
          exiftool: exiftoolJson,
          ffprobe: ffprobeJson,
          exifr: exifrJson,
        },
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      if (tempDirPath) {
        await rm(tempDirPath, { recursive: true, force: true });
      }
    }
  },
};
