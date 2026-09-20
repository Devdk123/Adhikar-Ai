import { NextRequest, NextResponse } from "next/server";
import { searchSchemes, type UserProfile } from "@/lib/myscheme";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      gender,
      age,
      state,
      residence,
      caste,
      disability,
      minority,
      isStudent,
      isBpl,
      isEconomicDistress,
      keyword = "",
      lang = "en",
      from = 0,
      size = 10,
    } = body;

    const profile: UserProfile = {
      gender,
      age: age ? Number(age) : undefined,
      state,
      residence,
      caste,
      disability,
      minority,
      isStudent,
      isBpl,
      isEconomicDistress,
    };

    const result = await searchSchemes(profile, { lang, from, size, keyword });

    return NextResponse.json({
      total: result.total,
      schemes: result.schemes,
      source: "myscheme.gov.in",
    });
  } catch (error) {
    console.error("Scheme search error:", error);

    // Fallback to static schemes
    return NextResponse.json(
      {
        total: 0,
        schemes: [],
        source: "fallback",
        error: "myScheme API unavailable, using local data",
      },
      { status: 200 }
    );
  }
}
