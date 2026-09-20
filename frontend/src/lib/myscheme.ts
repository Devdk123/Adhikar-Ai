/**
 * myScheme.gov.in API client
 * Public API for India's official government scheme discovery portal (4640+ schemes)
 * Falls back gracefully if API is unavailable
 */

const MYSCHEME_API_BASE = "https://api.myscheme.gov.in";
const MYSCHEME_API_KEY = process.env.MYSCHEME_API_KEY || "";

// ── Types ─────────────────────────────────────────────

export interface MySchemeFilter {
  identifier: string;
  value?: string;
  min?: string;
  max?: string;
}

export interface MySchemeHit {
  _id: string;
  slug: string;
  schemeName: string;
  schemeShortTitle?: string;
  briefDescription: string;
  nodalMinistryName: string;
  level: string;
  benefitTypes?: string;
  schemeCategory?: string[];
  tags?: string[];
}

export interface MySchemeSearchResult {
  total: number;
  schemes: MySchemeHit[];
  facets: Record<string, unknown>;
}

export interface MySchemeDetail {
  _id: string;
  slug: string;
  schemeName: string;
  schemeShortTitle: string;
  briefDescription: string;
  detailedDescription_md: string;
  benefits_md: string;
  exclusions_md?: string;
  eligibility_md?: string;
  applicationProcess?: { mode: string; url?: string; process_md: string }[];
  documents?: string[];
  ministry: string;
  category: string[];
  tags: string[];
  benefitType: string;
  level: string;
  references?: { title: string; url: string }[];
}

// ── Profile → filter conversion ───────────────────────

export interface UserProfile {
  gender?: "Male" | "Female" | "Transgender";
  age?: number;
  state?: string;
  residence?: "Urban" | "Rural";
  caste?: string;
  disability?: boolean;
  minority?: boolean;
  isStudent?: boolean;
  isBpl?: boolean;
  isEconomicDistress?: boolean;
}

/**
 * Convert a user profile into the myScheme.gov.in filter array format
 */
export function buildFilters(profile: UserProfile): MySchemeFilter[] {
  const filters: MySchemeFilter[] = [];

  // Gender — always include "All" + specific value
  if (profile.gender) {
    filters.push({ identifier: "gender", value: "All" });
    filters.push({ identifier: "gender", value: profile.gender });
  }

  // Age — uses caste-specific identifier (e.g., age-obc, age-general)
  if (profile.age !== undefined) {
    const casteSuffix = mapCasteToAgeSuffix(profile.caste);
    filters.push({
      identifier: `age-${casteSuffix}`,
      min: String(profile.age),
      max: String(profile.age),
    });
  }

  // State
  if (profile.state) {
    filters.push({ identifier: "beneficiaryState", value: "All" });
    filters.push({ identifier: "beneficiaryState", value: profile.state });
  }

  // Residence
  if (profile.residence) {
    filters.push({ identifier: "residence", value: "Both" });
    filters.push({ identifier: "residence", value: profile.residence });
  }

  // Caste
  if (profile.caste) {
    filters.push({ identifier: "caste", value: "All" });
    filters.push({ identifier: "caste", value: mapCasteValue(profile.caste) });
  }

  // Boolean filters — ONLY send when true (positive filtering)
  // These filters are additive in myScheme's API — they include schemes tagged
  // for these groups. We skip isBpl and isEconomicDistress as they drastically
  // narrow results (most schemes don't explicitly tag these).
  if (profile.disability === true) {
    filters.push({ identifier: "disability", value: "Yes" });
  }

  if (profile.minority === true) {
    filters.push({ identifier: "minority", value: "Yes" });
  }

  if (profile.isStudent === true) {
    filters.push({ identifier: "isStudent", value: "Yes" });
  }

  // Note: isBpl and isEconomicDistress are intentionally NOT sent as filters
  // because they drastically reduce results. The LLM will use this context
  // to prioritize BPL-friendly schemes from the broader result set.

  return filters;
}

function mapCasteToAgeSuffix(caste?: string): string {
  if (!caste) return "general";
  const lower = caste.toLowerCase();
  if (lower.includes("obc")) return "obc";
  if (lower.includes("sc")) return "sc";
  if (lower.includes("st")) return "st";
  if (lower.includes("pvtg")) return "pvtg";
  if (lower.includes("dnt")) return "dnt";
  return "general";
}

function mapCasteValue(caste: string): string {
  const lower = caste.toLowerCase();
  if (lower === "obc" || lower.includes("other backward"))
    return "Other Backward Class (OBC)";
  if (lower === "sc" || lower.includes("scheduled caste"))
    return "Scheduled Caste (SC)";
  if (lower === "st" || lower.includes("scheduled tribe"))
    return "Scheduled Tribe (ST)";
  if (lower.includes("pvtg"))
    return "Particularly Vulnerable Tribal Group (PVTG)";
  if (lower.includes("dnt") || lower.includes("nomadic"))
    return "De-Notified, Nomadic, and Semi-Nomadic (DNT) communities";
  if (lower === "ews") return "General"; // EWS falls under General with income filter
  return "General";
}

// ── API calls ─────────────────────────────────────────

const headers: Record<string, string> = {
  Accept: "application/json",
  "x-api-key": MYSCHEME_API_KEY,
  Origin: "https://www.myscheme.gov.in",
  Referer: "https://www.myscheme.gov.in/",
};

/**
 * Search schemes using eligibility filters
 */
export async function searchSchemes(
  profile: UserProfile,
  options: { lang?: string; from?: number; size?: number; keyword?: string } = {}
): Promise<MySchemeSearchResult> {
  const { lang = "en", from = 0, size = 10, keyword = "" } = options;
  const filters = buildFilters(profile);

  const params = new URLSearchParams({
    lang,
    q: JSON.stringify(filters),
    keyword,
    sort: "",
    from: String(from),
    size: String(size),
  });

  const response = await fetch(
    `${MYSCHEME_API_BASE}/search/v6/schemes?${params}`,
    { headers, next: { revalidate: 300 } }
  );

  if (!response.ok) {
    throw new Error(`myScheme search API error: ${response.status}`);
  }

  const data = await response.json();
  const hits = data.data?.hits?.items || [];

  return {
    total: data.data?.hits?.page?.total || 0,
    schemes: hits.map((item: Record<string, unknown>) => {
      const f = item.fields as Record<string, unknown> | undefined;
      return {
        _id: (item.id as string) || "",
        slug: (f?.slug as string) || "",
        schemeName: (f?.schemeName as string) || "",
        schemeShortTitle: (f?.schemeShortTitle as string) || "",
        briefDescription: (f?.briefDescription as string) || "",
        nodalMinistryName: (f?.nodalMinistryName as string) || "",
        level: (f?.level as string) || "",
        benefitTypes: "",
        schemeCategory: (f?.schemeCategory as string[]) || [],
        tags: (f?.tags as string[]) || [],
      };
    }),
    facets: data.data?.facets || {},
  };
}

/**
 * Get detailed scheme info by slug
 */
export async function getSchemeDetail(
  slug: string,
  lang = "en"
): Promise<MySchemeDetail | null> {
  const response = await fetch(
    `${MYSCHEME_API_BASE}/schemes/v6/public/schemes?slug=${encodeURIComponent(slug)}&lang=${lang}`,
    { headers, next: { revalidate: 600 } }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const scheme = data.data;
  if (!scheme) return null;

  const langData = scheme[lang] || scheme.en;
  if (!langData) return null;

  const basic = langData.basicDetails || {};
  const content = langData.schemeContent || {};

  return {
    _id: scheme._id,
    slug: scheme.slug || slug,
    schemeName: basic.schemeName || "",
    schemeShortTitle: basic.schemeShortTitle || "",
    briefDescription: content.briefDescription || "",
    detailedDescription_md: content.detailedDescription_md || "",
    benefits_md: content.benefits_md || "",
    exclusions_md: content.exclusions_md || "",
    eligibility_md: langData.eligibilityCriteria?.eligibilityDescription_md || "",
    applicationProcess: (langData.applicationProcess || []).map(
      (ap: Record<string, unknown>) => ({
        mode: (ap.mode as string) || "",
        url: (ap.url as string) || "",
        process_md: (ap.process_md as string) || "",
      })
    ),
    ministry: basic.nodalMinistryName?.label || "",
    category: (basic.schemeCategory || []).map(
      (c: Record<string, string>) => c.label
    ),
    tags: basic.tags || [],
    benefitType: content.benefitTypes?.label || "",
    level: basic.level?.label || "",
    references: content.references || [],
  };
}

/**
 * Get documents required for a scheme
 */
export async function getSchemeDocuments(
  schemeId: string,
  lang = "en"
): Promise<string[]> {
  const response = await fetch(
    `${MYSCHEME_API_BASE}/schemes/v6/public/schemes/${schemeId}/documents?lang=${lang}`,
    { headers }
  );

  if (!response.ok) return [];

  const data = await response.json();
  const docs = data.data?.[lang]?.documents_required || [];

  // Extract text from the structured document tree
  const docTexts: string[] = [];
  function extractText(nodes: Record<string, unknown>[]) {
    for (const node of nodes) {
      if (node.text && typeof node.text === "string" && node.text.trim()) {
        docTexts.push(node.text.trim());
      }
      if (Array.isArray(node.children)) {
        extractText(node.children as Record<string, unknown>[]);
      }
    }
  }
  extractText(docs);
  return docTexts;
}
