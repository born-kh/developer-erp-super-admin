import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { LANGUAGES, translations, type Dict, type Language } from "./translations";

const STORAGE_KEY = "derp-sa-lang";

function isLanguage(value: string | null): value is Language {
  return value === "ru" || value === "en" || value === "tj";
}

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "ru";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isLanguage(stored) ? stored : "ru";
}

export function getStoredLanguage(): Language {
  return getInitialLanguage();
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dict;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language] = useState<Language>(getInitialLanguage);

  const setLanguage = (lang: Language) => {
    if (lang === language) return;
    // Persist and do a full reload so every page refetches its data from the
    // server with the new Accept-Language header instead of showing stale content.
    window.localStorage.setItem(STORAGE_KEY, lang);
    window.location.reload();
  };

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t: translations[language] }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider");
  return ctx;
}

export { LANGUAGES };
export type { Language };
