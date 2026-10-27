import { writable } from "svelte/store";

export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "appTheme";

export const theme = writable<ThemeMode>("light");

export const setTheme = (mode: ThemeMode): void => {
  theme.set(mode);
  if (typeof window !== "undefined") {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }
};

export const loadTheme = (): void => {
  if (typeof window === "undefined") return;

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    theme.set(savedTheme);
  }
};