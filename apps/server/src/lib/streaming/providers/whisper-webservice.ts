// New file to integrate the containerized Whisper API
import type { TranscriptionProvider } from "../types.js";

export const whisperWebserviceProvider: TranscriptionProvider = {
  transcribe: async ({
    audio,
    model,
    apiKey,
    language,
    bias,
  }) => {
    const formData = new FormData();
    formData.append("audio_file", new Blob([audio], { type: "audio/wav" }));
    
    // Build query parameters based on the API spec
    const params = new URLSearchParams();
    params.append("encode", "true"); // Auto-encode with ffmpeg
    params.append("task", "transcribe");
    if (language) params.append("language", language);
    params.append("output", "json");
    
    const baseUrl = apiKey; // The API key field should contain the service URL
    const url = `${baseUrl}/asr?${params.toString()}`;
    
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Whisper webservice error: ${response.statusText}`);
    }
    
    const result = await response.json();
    return {
      text: result, // The API returns plain text by default
    };
  },
};
