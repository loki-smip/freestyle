import { createAppLogger } from "@freestyle/utils";
import type {
  TranscribeOptions,
  TranscribeResult,
  TranscriptionProvider,
} from "../types.js";

const log = createAppLogger("whisper-webservice");

export class WhisperWebserviceTranscriptionProvider
  implements TranscriptionProvider
{
  readonly providerId = "whisper-webservice";

  async transcribe(opts: TranscribeOptions): Promise<TranscribeResult> {
    const formData = new FormData();
    const audioBuffer = opts.audio.buffer.slice(
      opts.audio.byteOffset,
      opts.audio.byteOffset + opts.audio.byteLength,
    ) as ArrayBuffer;
    formData.append(
      "audio_file",
      new Blob([audioBuffer], { type: "audio/wav" }),
      "audio.wav",
    );

    // Build query parameters based on the API spec
    const params = new URLSearchParams();
    params.append("encode", "true"); // Auto-encode with ffmpeg
    params.append("task", "transcribe");
    if (opts.language) params.append("language", opts.language);
    params.append("output", "json");

    const baseUrl = opts.apiKey; // The API key field should contain the service URL
    const url = `${baseUrl}/asr?${params.toString()}`;

    log.debug(`Transcribing via Whisper webservice: ${url}`);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Whisper webservice error: HTTP ${response.status} ${detail}`,
      );
    }

    const result = await response.json();
    return {
      text: result?.text || result || "",
    };
  }

  supportsStreaming(_modelId: string): boolean {
    return false;
  }
}
