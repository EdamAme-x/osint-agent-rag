import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  PROCESS_EXEC_TIMEOUT_MS,
  PROCESS_MAX_BUFFER_BYTES,
} from "../../config/constants.js";

const execFileAsync = promisify(execFile);

export async function runCommand(command: string, args: string[]) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout: PROCESS_EXEC_TIMEOUT_MS,
      maxBuffer: PROCESS_MAX_BUFFER_BYTES,
    });
    return { ok: true as const, stdout, stderr };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
