"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  LOCALE_STORAGE_KEY,
  LANGUAGE_OPTION_LABELS,
  Locale,
  SUPPORTED_LOCALES,
  detectBrowserLocale,
  normalizeLocale,
  translate
} from "@/lib/i18n";

type TranslateParams = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslateParams) => string;
  locales: readonly Locale[];
  localeLabels: Record<Locale, string>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryLocale = params.get("lang");
    if (queryLocale) {
      setLocale(normalizeLocale(queryLocale));
      return;
    }

    const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (storedLocale) {
      setLocale(normalizeLocale(storedLocale));
      return;
    }

    setLocale(detectBrowserLocale());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const t = useCallback(
    (key: string, params?: TranslateParams) => translate(locale, key, params),
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      locales: SUPPORTED_LOCALES,
      localeLabels: LANGUAGE_OPTION_LABELS
    }),
    [locale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within LanguageProvider");
  }
  return context;
}
