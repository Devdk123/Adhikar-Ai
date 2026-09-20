import type { SupportedLanguage } from "./types";

const _TRANSLATIONS = {
  en: {
    sidebar: {
      newChat: "New chat",
      searchPlaceholder: "Search chats...",
      emptyState: "Your conversations will appear here",
      footerTitle: "Adhikaar AI",
      footerSubtitle: "Welfare Copilot",
      today: "Today",
      yesterday: "Yesterday",
      last7Days: "Previous 7 days",
      older: "Older",
    },
    chat: {
      headerTitle: "Adhikaar",
      placeholder: "Message Adhikaar...",
      botName: "Adhikaar",
      userName: "You",
      errorMessage: "I'm sorry, I encountered an error. Please try again.",
      disclaimer: "Adhikaar can explore schemes and apply for you. Verify information independently.",
      emptyHeading: "How can I help you?",
      emptySubtitle: "Find government schemes, check eligibility, and apply — all in one place.",
      copy: "Copy",
      regenerate: "Regenerate",
      voiceInput: "Voice input",
      suggestedPrompts: {
        farmer: "Farmer Schemes",
        healthcare: "Healthcare",
        employment: "Employment",
        women: "Women & Education",
      },
    },
  },
  hi: {
    sidebar: {
      newChat: "नई बातचीत",
      searchPlaceholder: "चैट खोजें...",
      emptyState: "आपकी बातचीत यहाँ दिखाई देगी",
      footerTitle: "अधिकार AI",
      footerSubtitle: "कल्याण सहायक",
      today: "आज",
      yesterday: "कल",
      last7Days: "पिछले 7 दिन",
      older: "पुराने",
    },
    chat: {
      headerTitle: "अधिकार",
      placeholder: "अधिकार को संदेश भेजें...",
      botName: "अधिकार",
      userName: "आप",
      errorMessage: "क्षमा करें, कोई त्रुटि हुई। कृपया पुन: प्रयास करें।",
      disclaimer: "अधिकार योजनाएँ खोज सकता है और आवेदन कर सकता है। जानकारी की पुष्टि करें।",
      emptyHeading: "मैं आपकी क्या मदद कर सकता हूँ?",
      emptySubtitle: "सरकारी योजनाएँ खोजें, पात्रता जाँचें और आवेदन करें — सब एक ही स्थान पर।",
      copy: "कॉपी",
      regenerate: "पुनः उत्पन्न करें",
      voiceInput: "आवाज इनपुट",
      suggestedPrompts: {
        farmer: "किसान योजनाएं",
        healthcare: "स्वास्थ्य देखभाल",
        employment: "रोजगार",
        women: "महिला एवं शिक्षा",
      },
    },
  },
};

export type TranslationKey = typeof _TRANSLATIONS.en;

/**
 * Get translations for a language.
 * Falls back to Hindi for Devanagari-script languages (mr),
 * and to English for all others.
 *
 * The LLM handles all 11 languages for conversation text —
 * this is only for UI chrome (sidebar labels, button text, placeholders).
 */
export function getTranslation(lang: SupportedLanguage): TranslationKey {
  if (lang in _TRANSLATIONS) {
    return _TRANSLATIONS[lang as keyof typeof _TRANSLATIONS];
  }
  // Marathi also uses Devanagari — fall back to Hindi
  if (lang === "mr") return _TRANSLATIONS.hi;
  // All other languages fall back to English
  return _TRANSLATIONS.en;
}

/** @deprecated Use getTranslation(lang) instead for type-safe access */
export const TRANSLATIONS = _TRANSLATIONS;
