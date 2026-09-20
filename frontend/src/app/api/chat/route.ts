import { NextRequest, NextResponse } from "next/server";
import { chatWithLLM, toChatMessages } from "@/lib/llm";
import { WELFARE_AGENT_PROMPT } from "@/lib/prompts";
import { searchSchemes, type UserProfile } from "@/lib/myscheme";
import schemes from "@/data/schemes.json";
import { matchSchemes } from "@/lib/schemes";
import type { CitizenProfile, Scheme } from "@/lib/types";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

/**
 * Extract [PROFILE_COMPLETE: {...}] from LLM response
 */
function extractProfile(text: string): UserProfile | null {
  const match = text.match(/\[PROFILE_COMPLETE:\s*(\{[^}]+\})\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/**
 * Extract [FAMILY_MEMBER: {...}] tags from LLM response
 */
function extractFamilyMembers(text: string): (UserProfile & { name?: string; relationship?: string })[] {
  const members: (UserProfile & { name?: string; relationship?: string })[] = [];
  const regex = /\[FAMILY_MEMBER:\s*(\{[^}]+\})\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try {
      members.push(JSON.parse(match[1]));
    } catch {
      // skip malformed
    }
  }
  return members;
}

/**
 * Check for [FAMILY_COMPLETE: {...}] tag
 */
function extractFamilyComplete(text: string): { primaryName?: string; totalMembers?: number } | null {
  const match = text.match(/\[FAMILY_COMPLETE:\s*(\{[^}]+\})\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/**
 * Convert myScheme profile to local CitizenProfile for fallback matching
 */
function toLocalProfile(profile: UserProfile): CitizenProfile {
  const casteMap: Record<string, "general" | "obc" | "sc" | "st" | "ews"> = {
    General: "general",
    OBC: "obc",
    SC: "sc",
    ST: "st",
  };
  return {
    gender:
      profile.gender === "Male"
        ? "male"
        : profile.gender === "Female"
          ? "female"
          : "other",
    age: profile.age,
    state: profile.state,
    category: casteMap[profile.caste || "General"] || "general",
    bplCard: profile.isBpl,
    hasDisability: profile.disability,
  };
}

/**
 * Search schemes for a single profile — tries myScheme API, falls back to local
 */
async function searchForProfile(
  profile: UserProfile,
  language: string
): Promise<string> {
  try {
    const result = await searchSchemes(profile, { lang: language, size: 10 });
    if (result.total > 0) {
      let data = `${result.total} schemes found. Top matches:\n`;
      data += result.schemes
        .slice(0, 8)
        .map(
          (s, i) =>
            `${i + 1}. ${s.schemeName} (${s.schemeShortTitle || s.slug}) — ${s.briefDescription?.slice(0, 120)}... | Benefit: ${s.benefitTypes || "Various"}`
        )
        .join("\n");
      return data;
    }
    throw new Error("No results");
  } catch {
    // Fallback to local
    const localProfile = toLocalProfile(profile);
    const matched = matchSchemes(localProfile, schemes as Scheme[]);
    if (matched.length > 0) {
      let data = `${matched.length} schemes matched (local). Top:\n`;
      data += matched
        .slice(0, 6)
        .map(
          (m, i) =>
            `${i + 1}. ${m.scheme.name} — ${m.scheme.description.slice(0, 100)} | Benefit: ${m.scheme.maxBenefit} | Score: ${m.eligibilityScore}%`
        )
        .join("\n");
      return data;
    }
    return "No matching schemes found.";
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 30 messages per minute per IP
    const limited = rateLimit(getRateLimitKey(req, "chat"), { maxRequests: 30, windowMs: 60_000 });
    if (limited) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const { messages, language = "hi" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array required" },
        { status: 400 }
      );
    }

    const langNames: Record<string, string> = {
      hi: "Hindi (Devanagari script)",
      ta: "Tamil (தமிழ் script)",
      te: "Telugu (తెలుగు script)",
      bn: "Bengali (বাংলা script)",
      mr: "Marathi (Devanagari script)",
      gu: "Gujarati (ગુજરાતી script)",
      kn: "Kannada (ಕನ್ನಡ script)",
      ml: "Malayalam (മലയാളം script)",
      pa: "Punjabi (Gurmukhi script)",
      or: "Odia (ଓଡ଼ିଆ script)",
    };

    const langInstruction = language === "en"
      ? "\n\nIMPORTANT: Respond in simple English. Ensure all [SCHEME_CARD] tags use English contents."
      : `\n\nIMPORTANT: Respond in ${langNames[language] || "Hindi (Devanagari script)"}. Use simple language that everyone can understand. Ensure any scheme name (name) or benefit description (benefit) inside [SCHEME_CARD] tags is also translated.`;

    const systemPrompt = WELFARE_AGENT_PROMPT + langInstruction;

    const chatMessages = toChatMessages(
      messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))
    );

    // Step 1: Get initial LLM response
    let response = await chatWithLLM(chatMessages, systemPrompt);

    // Step 2: Check if the LLM emitted a [PROFILE_COMPLETE] tag
    const profile = extractProfile(response);

    if (profile) {
      console.log("[Adhikaar] Profile detected, searching myScheme.gov.in:", profile);

      const extraContext = [];
      if (profile.isBpl) extraContext.push("BPL card holder");
      if (profile.isEconomicDistress) extraContext.push("in economic distress");

      const schemeResults = await searchForProfile(profile, language);
      let schemeData = `\n\n[SYSTEM: Live search results from myScheme.gov.in for this citizen.`;
      if (extraContext.length > 0) {
        schemeData += ` Note: User is ${extraContext.join(" and ")} — prioritize schemes for economically weaker sections.`;
      }
      schemeData += `\n${schemeResults}`;
      schemeData += `\n\nPresent the top 5 most relevant schemes using [SCHEME_CARD] tags. After presenting, ask if they want to find schemes for family members too.]`;

      // Step 3: Feed scheme data back to LLM for a formatted response
      const followUpMessages = [
        ...chatMessages,
        { role: "assistant" as const, content: response },
        { role: "user" as const, content: schemeData },
      ];

      response = await chatWithLLM(followUpMessages, systemPrompt);
    }

    // Step 3b: Check for FAMILY_MEMBER tags — search for each family member
    const familyMembers = extractFamilyMembers(response);
    const familyComplete = extractFamilyComplete(response);

    if (familyMembers.length > 0) {
      console.log(`[Adhikaar] Family member detected: ${familyMembers.map(m => m.name).join(", ")}`);

      // Search for each family member in parallel
      const memberResults = await Promise.all(
        familyMembers.map(async (member) => {
          const results = await searchForProfile(member, language);
          return { name: member.name || "Member", relationship: member.relationship || "", results };
        })
      );

      let familyData = `\n\n[SYSTEM: Scheme search results for family members:\n`;
      for (const mr of memberResults) {
        familyData += `\n--- ${mr.name} (${mr.relationship}) ---\n${mr.results}\n`;
      }
      familyData += `\nPresent results for each family member using [SCHEME_CARD] tags, grouped by member name. Show the total combined benefit for the whole family.]`;

      const followUpMessages = [
        ...chatMessages,
        { role: "assistant" as const, content: response },
        { role: "user" as const, content: familyData },
      ];

      response = await chatWithLLM(followUpMessages, systemPrompt);
    } else if (familyComplete) {
      // Family complete signal without new members in this message
      // The LLM should summarize at this point
      console.log(`[Adhikaar] Family complete: ${familyComplete.totalMembers} members`);
    }

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
