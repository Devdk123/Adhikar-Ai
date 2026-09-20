const SARVAM_API_KEY = process.env.SARVAM_API_KEY || "";
const SARVAM_BASE_URL = "https://api.sarvam.ai";

/** Max retry attempts for transient failures */
const MAX_RETRIES = 3;
/** Base delay between retries (ms) — doubles each attempt */
const RETRY_BASE_DELAY_MS = 800;

/**
 * Retry helper with exponential backoff.
 * Retries on 429 (rate limit), 500-599 (server errors), and network errors.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry on client errors (4xx) except 429 rate limit
      const statusMatch = lastError.message.match(/error:\s*(\d{3})/);
      if (statusMatch) {
        const status = parseInt(statusMatch[1], 10);
        if (status >= 400 && status < 500 && status !== 429) {
          throw lastError; // Non-retryable client error
        }
      }

      if (attempt < maxRetries) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `[sarvam] ${label} attempt ${attempt + 1} failed: ${lastError.message}. Retrying in ${delay}ms...`
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError!;
}

export async function speechToText(
  audioBuffer: ArrayBuffer,
  languageCode: string = "hi-IN"
): Promise<string> {
  return withRetry(async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([audioBuffer], { type: "audio/wav" }),
      "audio.wav"
    );
    formData.append("language_code", languageCode);
    formData.append("model", "saarika:v2");

    const response = await fetch(`${SARVAM_BASE_URL}/speech-to-text`, {
      method: "POST",
      headers: {
        "api-subscription-key": SARVAM_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Sarvam STT error: ${response.status}`);
    }

    const data = await response.json();
    const transcript = data.transcript || "";

    // Guard: very short transcripts from noisy audio are unreliable
    if (transcript.trim().length < 2) {
      console.warn(
        `[sarvam] STT returned near-empty transcript: "${transcript}"`
      );
      return "";
    }

    return transcript;
  }, "STT");
}

export async function textToSpeech(
  text: string,
  targetLanguageCode: string = "hi-IN",
  speaker: string = "anushka"
): Promise<string> {
  return withRetry(async () => {
    const response = await fetch(`${SARVAM_BASE_URL}/text-to-speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY,
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: targetLanguageCode,
        speaker: speaker,
        model: "bulbul:v2",
      }),
    });

    if (!response.ok) {
      throw new Error(`Sarvam TTS error: ${response.status}`);
    }

    const data = await response.json();
    return data.audios?.[0] || ""; // base64 encoded audio
  }, "TTS");
}

export async function translateText(
  text: string,
  sourceLang: string = "en",
  targetLang: string = "hi"
): Promise<string> {
  const langMap: Record<string, string> = {
    en: "en-IN",
    hi: "hi-IN",
    ta: "ta-IN",
    te: "te-IN",
    bn: "bn-IN",
    mr: "mr-IN",
    gu: "gu-IN",
    kn: "kn-IN",
    ml: "ml-IN",
    pa: "pa-IN",
  };

  return withRetry(async () => {
    const response = await fetch(`${SARVAM_BASE_URL}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY,
      },
      body: JSON.stringify({
        input: text,
        source_language_code: langMap[sourceLang] || sourceLang,
        target_language_code: langMap[targetLang] || targetLang,
        model: "mayura:v1",
      }),
    });

    if (!response.ok) {
      throw new Error(`Sarvam Translation error: ${response.status}`);
    }

    const data = await response.json();
    return data.translated_text || text;
  }, "Translate");
}
