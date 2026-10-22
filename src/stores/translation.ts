import { derived, get, writable } from "svelte/store";

import Translation, { type Language, type TranslationKeys } from "../i18n";

export const language = writable<Language>("en");
export const translations = derived(language, (lang) => Translation[lang]);

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

export const t = (key: TranslationKeys): string => {
  const currentLang = get(language);
  return Translation[currentLang]?.[key] || Translation.id[key] || key;
};
