const translations = {
  id: {
    welcome: "Selamat Datang",
    welcomeSubs: "Masuk ke akun Anda untuk mengelola keuangan",
  },
  en: {
    welcome: "Welcome",
    welcomeSubs: "Login to your account to manage your finances",
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKeys = keyof typeof translations.id;

export default translations;
