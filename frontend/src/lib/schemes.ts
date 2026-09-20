import { CitizenProfile, Scheme, SchemeMatch } from "./types";

export function matchSchemes(
  profile: CitizenProfile,
  schemes: Scheme[]
): SchemeMatch[] {
  const matches: SchemeMatch[] = [];

  for (const scheme of schemes) {
    if (scheme.status !== "active") continue;

    const { score, matched, missing } = calculateEligibility(profile, scheme);

    if (score >= 40) {
      matches.push({
        scheme,
        eligibilityScore: score,
        matchedCriteria: matched,
        missingDocuments: missing,
      });
    }
  }

  return matches.sort((a, b) => b.eligibilityScore - a.eligibilityScore);
}

function calculateEligibility(
  profile: CitizenProfile,
  scheme: Scheme
): { score: number; matched: string[]; missing: string[] } {
  const criteria = scheme.eligibility;
  const matched: string[] = [];
  const failed: string[] = [];
  let totalCriteria = 0;
  let matchedCriteria = 0;

  // Age check
  if (criteria.minAge !== undefined || criteria.maxAge !== undefined) {
    totalCriteria++;
    if (profile.age !== undefined) {
      const ageOk =
        (criteria.minAge === undefined || profile.age >= criteria.minAge) &&
        (criteria.maxAge === undefined || profile.age <= criteria.maxAge);
      if (ageOk) {
        matchedCriteria++;
        matched.push("Age requirement met");
      } else {
        failed.push("Age not in eligible range");
      }
    }
  }

  // Gender check
  if (criteria.gender && criteria.gender !== "any") {
    totalCriteria++;
    if (profile.gender === criteria.gender) {
      matchedCriteria++;
      matched.push("Gender requirement met");
    } else if (profile.gender) {
      return { score: 0, matched: [], missing: [] };
    }
  }

  // Income check
  if (criteria.maxIncome !== undefined) {
    totalCriteria++;
    if (profile.income !== undefined) {
      if (profile.income <= criteria.maxIncome) {
        matchedCriteria++;
        matched.push("Income within eligible range");
      } else {
        failed.push("Income exceeds limit");
      }
    }
  }

  // Category check
  if (criteria.categories && criteria.categories.length > 0) {
    totalCriteria++;
    if (profile.category) {
      if (criteria.categories.includes(profile.category)) {
        matchedCriteria++;
        matched.push(`${profile.category.toUpperCase()} category eligible`);
      } else {
        failed.push("Category not eligible");
      }
    }
  }

  // Occupation check
  if (criteria.occupation && criteria.occupation.length > 0) {
    totalCriteria++;
    if (profile.occupation) {
      const occupationMatch = criteria.occupation.some(
        (occ) =>
          profile.occupation!.toLowerCase().includes(occ.toLowerCase()) ||
          occ.toLowerCase().includes(profile.occupation!.toLowerCase())
      );
      if (occupationMatch) {
        matchedCriteria++;
        matched.push("Occupation matches");
      } else {
        failed.push("Occupation does not match");
      }
    }
  }

  // State check
  if (criteria.states && criteria.states !== "all") {
    totalCriteria++;
    if (profile.state) {
      if (criteria.states.includes(profile.state)) {
        matchedCriteria++;
        matched.push("State eligible");
      } else {
        return { score: 0, matched: [], missing: [] };
      }
    }
  } else if (criteria.states === "all") {
    matched.push("Available in all states");
  }

  // BPL check
  if (criteria.bplRequired) {
    totalCriteria++;
    if (profile.bplCard === true) {
      matchedCriteria++;
      matched.push("BPL card holder");
    } else if (profile.bplCard === false) {
      failed.push("BPL card required");
    }
  }

  // Land ownership check
  if (criteria.landOwnership) {
    totalCriteria++;
    if (profile.landOwnership) {
      if (
        criteria.landOwnership === "required" &&
        profile.landOwnership === "owns-land"
      ) {
        matchedCriteria++;
        matched.push("Land ownership verified");
      } else if (
        criteria.landOwnership === "landless-only" &&
        profile.landOwnership === "landless"
      ) {
        matchedCriteria++;
        matched.push("Landless criteria met");
      } else if (criteria.landOwnership === "not-required") {
        matchedCriteria++;
        matched.push("No land requirement");
      }
    }
  }

  // Rural/Urban check
  if (criteria.ruralOnly || criteria.urbanOnly) {
    totalCriteria++;
    // Default to matching since we don't always have this data
    matchedCriteria++;
  }

  // Calculate score
  const score =
    totalCriteria > 0
      ? Math.round((matchedCriteria / totalCriteria) * 100)
      : 75; // Default score if no specific criteria

  // Find missing documents — exclude docs implied by profile data
  const impliedDocs = new Set<string>();
  if (profile.aadhaarNumber) impliedDocs.add("aadhaar");
  if (profile.bankAccount) {
    impliedDocs.add("bank");
    impliedDocs.add("passbook");
  }
  if (profile.bplCard) impliedDocs.add("bpl");
  if (profile.income) impliedDocs.add("income");

  const missing = scheme.documentsRequired.filter((doc) => {
    const lower = doc.toLowerCase();
    for (const implied of impliedDocs) {
      if (lower.includes(implied)) return false;
    }
    return true;
  });

  return { score: Math.min(score, 100), matched, missing };
}
