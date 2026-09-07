import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getModuleDefaultOptions, type ModuleDefaultOptions } from "../lib/api";

const STORAGE_KEY = "derp-sa-module-settings";
const FALLBACK: ModuleDefaultOptions = {
  defaultLanguage: "ru",
  nationalCurrencyCode: "USD",
  supportedLanguages: ["ru"],
};

function isValidSettings(value: unknown): value is ModuleDefaultOptions {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<ModuleDefaultOptions>;
  return (
    typeof v.defaultLanguage === "string" &&
    Array.isArray(v.supportedLanguages) &&
    v.supportedLanguages.length > 0
  );
}

function loadCachedSettings(): ModuleDefaultOptions | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isValidSettings(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

type ModuleSettingsContextValue = {
  settings: ModuleDefaultOptions;
  loading: boolean;
};

const ModuleSettingsContext = createContext<ModuleSettingsContextValue>({
  settings: FALLBACK,
  loading: true,
});

export function ModuleSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ModuleDefaultOptions>(() => loadCachedSettings() ?? FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModuleDefaultOptions()
      .then((res) => {
        if (!isValidSettings(res)) return;
        setSettings(res);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ModuleSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </ModuleSettingsContext.Provider>
  );
}

export function useModuleSettings() {
  return useContext(ModuleSettingsContext);
}
