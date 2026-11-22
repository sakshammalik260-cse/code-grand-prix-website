import { ERROR_CODES } from "../constants/index.js";
import { AppError } from "../middleware/error.middleware.js";

export class JudgeUnavailable extends AppError {
  constructor(readonly stage: string) {
    super(503, ERROR_CODES.JUDGE_UNAVAILABLE, "Code execution is temporarily unavailable. Try again or contact race control.");
  }
}

export async function readJudgeJson(response: Response, limit: number): Promise<unknown> {
  if (!response.body || Number(response.headers.get("content-length")) > limit) {
    await response.body?.cancel();
    throw new JudgeUnavailable("response-size");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new JudgeUnavailable("response-size");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally {
    reader.releaseLock();
  }
}
