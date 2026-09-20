import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_VISION_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const EXTRACTION_PROMPT = `You are an Indian government document OCR system. Extract structured data from this document image.

Identify the document type (Aadhaar Card, BPL Card, Caste Certificate, Land Record, Ration Card, or Other) and extract ALL visible fields.

For Aadhaar Card, extract: name, date_of_birth, gender, aadhaar_number, address (full text), state, district
For BPL Card / Ration Card, extract: head_of_family, family_members (array of {name, age, gender, relationship}), card_number, state, district, bpl_status
For Caste Certificate, extract: name, caste, category (General/OBC/SC/ST), issuing_authority
For Land Record, extract: owner_name, survey_number, land_area, land_area_unit, village, tehsil, district, state

Return ONLY valid JSON in this exact format:
{
  "document_type": "aadhaar_card" | "bpl_card" | "ration_card" | "caste_certificate" | "land_record" | "other",
  "confidence": 0.0 to 1.0,
  "extracted": { ... fields based on document type ... },
  "profile_fields": {
    "name": "...",
    "age": null or number (calculate from DOB if available),
    "gender": "Male" | "Female" | "Transgender" | null,
    "state": "..." | null,
    "district": "..." | null,
    "aadhaar": "..." | null,
    "category": "General" | "OBC" | "SC" | "ST" | null,
    "family_members": null or [{name, age, gender, relationship}]
  }
}

If you cannot read the document clearly, set confidence below 0.5 and include what you can read.
Do NOT include any text outside the JSON object.`;

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 OCR requests per minute
    const limited = rateLimit(getRateLimitKey(req, "ocr"), {
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (limited) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "OCR service not configured" },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("image") as Blob | null;

    if (!file) {
      return NextResponse.json(
        { error: "Image file required" },
        { status: 400 }
      );
    }

    // Convert to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Detect MIME type
    const mimeType =
      file.type || "image/jpeg";

    // Call Gemini Vision
    const response = await fetch(`${GEMINI_VISION_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: EXTRACTION_PROMPT },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      console.error("Gemini Vision error:", await response.text());
      return NextResponse.json(
        { error: "OCR processing failed" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not extract data from document" },
        { status: 422 }
      );
    }

    const extracted = JSON.parse(jsonMatch[0]);

    return NextResponse.json(extracted);
  } catch (error) {
    console.error("OCR API error:", error);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}
