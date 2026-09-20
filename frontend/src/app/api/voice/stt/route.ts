import { NextRequest, NextResponse } from "next/server";
import { speechToText } from "@/lib/sarvam";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as Blob | null;
    const language = (formData.get("language") as string) || "hi-IN";

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file required" }, { status: 400 });
    }

    const buffer = await audioFile.arrayBuffer();
    const transcript = await speechToText(buffer, language);

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("STT error:", error);
    return NextResponse.json(
      { error: "Speech-to-text failed" },
      { status: 500 }
    );
  }
}
