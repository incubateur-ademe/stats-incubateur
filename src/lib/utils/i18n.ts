export const AVAILABLE_LOCALES = {
  en: "en",
  fr: "fr",
} as const;
export const DEFAULT_LOCALE = AVAILABLE_LOCALES.fr;
export const LOCALE_LABELS = {
  [AVAILABLE_LOCALES.en]: "English",
  [AVAILABLE_LOCALES.fr]: "Français",
};
export type Locale = keyof typeof AVAILABLE_LOCALES;
