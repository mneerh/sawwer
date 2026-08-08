"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { ar, dictionaries, type Dictionary, type Locale } from "@/lib/i18n/dictionary";

const STORAGE_KEY = "sawwer.locale";

/**
 * The chosen locale lives in localStorage, which makes it external state —
 * so it is read through useSyncExternalStore rather than copied into React
 * state inside an effect. The server always renders Arabic (matching the
 * `lang`/`dir` on <html>), and a stored preference is applied at hydration.
 */
const listeners = new Set<() => void>();
let cached: Locale | null = null;

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): Locale {
  if (cached === null) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      cached = stored === "en" || stored === "ar" ? stored : "ar";
    } catch {
      cached = "ar";
    }
  }
  return cached;
}

function getServerSnapshot(): Locale {
  return "ar";
}

function writeLocale(next: Locale): void {
  cached = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private browsing can refuse writes; the choice still applies this session.
  }
  listeners.forEach((listener) => listener());
}

type LanguageValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: Dictionary;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Keep the document in sync — an external system, which is what effects are for.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = useCallback((next: Locale) => writeLocale(next), []);

  const value = useMemo<LanguageValue>(
    () => ({
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      t: dictionaries[locale],
      setLocale,
    }),
    [locale, setLocale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const context = useContext(LanguageContext);
  if (!context) {
    // Keeps isolated component rendering (and tests) from crashing.
    return { locale: "ar", dir: "rtl", t: ar, setLocale: () => {} };
  }
  return context;
}
