import { writable } from "svelte/store";

const STORAGE_KEY = "autoCategorizationEnabled";

export const autoCategorization = writable(false);

export const setAutoCategorization = (enabled: boolean): void => {
  autoCategorization.set(enabled);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }
};

export const loadAutoCategorization = (): void => {
  if (typeof window === "undefined") return;

  const savedPreference = localStorage.getItem(STORAGE_KEY);
  if (savedPreference === "true" || savedPreference === "false") {
    autoCategorization.set(savedPreference === "true");
  }
};