export interface Scheme {
  id: string;
  name: string;
  nameHindi: string;
  category: SchemeCategory;
  ministry: string;
  description: string;
  descriptionHindi: string;
  benefits: string[];
  eligibility: EligibilityCriteria;
  documentsRequired: string[];
  applicationUrl: string;
  maxBenefit: string;
  frequency: "one-time" | "monthly" | "quarterly" | "annual";
  status: "active" | "inactive";
}

export type SchemeCategory =
  | "agriculture"
  | "housing"
  | "healthcare"
  | "education"
  | "employment"
  | "women"
  | "social-security"
  | "financial"
  | "skill-development"
  | "rural"
  | "urban";

export interface EligibilityCriteria {
  minAge?: number;
  maxAge?: number;
  gender?: "male" | "female" | "any";
  maxIncome?: number;
  categories?: ("general" | "obc" | "sc" | "st" | "ews")[];
  occupation?: string[];
  states?: string[] | "all";
  bplRequired?: boolean;
  landOwnership?: "required" | "not-required" | "landless-only";
  education?: string[];
  ruralOnly?: boolean;
  urbanOnly?: boolean;
}

export interface CitizenProfile {
  name?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  state?: string;
  district?: string;
  income?: number;
  category?: "general" | "obc" | "sc" | "st" | "ews";
  occupation?: string;
  familySize?: number;
  bplCard?: boolean;
  education?: string;
  hasDisability?: boolean;
  landOwnership?: "owns-land" | "landless";
  aadhaarNumber?: string;
  bankAccount?: boolean;
}

export interface SchemeMatch {
  scheme: Scheme;
  eligibilityScore: number;
  matchedCriteria: string[];
  missingDocuments: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  schemes?: SchemeMatch[];
  documents?: string[];
  language?: SupportedLanguage;
}

export interface Application {
  id: string;
  schemeId: string;
  schemeName: string;
  status: ApplicationStatus;
  appliedDate: Date;
  documents: UploadedDocument[];
  referenceNumber?: string;
  timeline: ApplicationEvent[];
}

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under-review"
  | "verified"
  | "approved"
  | "rejected"
  | "disbursed";

export interface ApplicationEvent {
  status: ApplicationStatus;
  date: Date;
  description: string;
}

export interface UploadedDocument {
  name: string;
  type: string;
  uploaded: boolean;
  verified: boolean;
}

export type SupportedLanguage = "en" | "hi" | "ta" | "te" | "bn" | "mr" | "gu" | "kn" | "ml" | "pa" | "or";

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English",
  hi: "हिन्दी",
  ta: "தமிழ்",
  te: "తెలుగు",
  bn: "বাংলা",
  mr: "मराठी",
  gu: "ગુજરાતી",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  pa: "ਪੰਜਾਬੀ",
  or: "ଓଡ଼ିଆ",
};

/** Sarvam AI language codes for STT/TTS */
export const SARVAM_LANG_CODES: Record<SupportedLanguage, string> = {
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
  or: "or-IN",
};

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh",
] as const;
