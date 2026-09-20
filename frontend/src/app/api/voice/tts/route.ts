import { NextRequest, NextResponse } from "next/server";
import { textToSpeech } from "@/lib/sarvam";

export async function POST(req: NextRequest) {
  try {
    const { text, language = "hi-IN", speaker = "anushka" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text required" }, { status: 400 });
    }

    // Strip markdown/tags for cleaner TTS
    let cleanText = text
      .replace(/\[SCHEME_CARD:[^\]]+\]/g, "")
      .replace(/\[READY_TO_APPLY:[\s\S]*?\}\s*\]/g, "")
      .replace(/\[PROFILE_COMPLETE:[^\]]*\]/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/[#*_~`]/g, "")
      .replace(/\n+/g, " ")
      .trim();

    if (!cleanText) {
      return NextResponse.json({ error: "No speakable text" }, { status: 400 });
    }

    // Sarvam TTS limit ~500 chars
    cleanText = cleanText.slice(0, 500);

    // Sarvam TTS handles both Devanagari and Roman scripts natively
    const langCode = language.startsWith("hi") ? "hi-IN" : "en-IN";
    const audioBase64 = await textToSpeech(cleanText, langCode, speaker);

    if (!audioBase64) {
      return NextResponse.json({ error: "No audio generated" }, { status: 500 });
    }

    return NextResponse.json({ audio: audioBase64 });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: "Text-to-speech failed" },
      { status: 500 }
    );
  }
}
