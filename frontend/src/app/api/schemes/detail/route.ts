import { NextRequest, NextResponse } from "next/server";
import { getSchemeDetail, getSchemeDocuments } from "@/lib/myscheme";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const lang = searchParams.get("lang") || "en";

  if (!slug) {
    return NextResponse.json({ error: "slug parameter required" }, { status: 400 });
  }

  try {
    const detail = await getSchemeDetail(slug, lang);
    if (!detail) {
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    }

    // Also fetch documents
    const docs = await getSchemeDocuments(detail._id, lang);

    return NextResponse.json({
      ...detail,
      documents: docs,
      source: "myscheme.gov.in",
    });
  } catch (error) {
    console.error("Scheme detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheme detail" },
      { status: 500 }
    );
  }
}
