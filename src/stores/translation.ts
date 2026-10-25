import { get, writable } from "svelte/store";

import Translation, { type Language, type TranslationKeys } from "@/i18n";

export const language = writable<Language>("en");

export const setLanguage = (lang: Language): void => {
  language.set(lang);
  if (typeof window !== "undefined") {
    localStorage.setItem("appLanguage", lang);
  }
};

export const loadLanguage = (): void => {
  if (typeof window !== "undefined") {
    const savedLang = localStorage.getItem("appLanguage") as Language;
    if (savedLang === "id" || savedLang === "en") {
      language.set(savedLang);
    }
  }
};

export const t = (
  key: TranslationKeys,
  currentLang: Language = get(language),
): string => {
  return Translation[currentLang]?.[key] || Translation.id[key] || key;
};
