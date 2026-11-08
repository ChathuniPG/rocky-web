"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  getLocaleSnapshot,
  getServerLocaleSnapshot,
  setStoredLocale,
  subscribeToLocale,
} from "./locale-storage";
import { createTranslator, getDictionary, type Locale, type Translate } from "./translate";

type I18nContextValue = { locale: Locale; t: Translate; setLocale: (locale: Locale) => void };

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Provides the active language and its translator to client components
 * (FR-SET-03). The language lives in a small store outside React (remembered in
 * localStorage); useSyncExternalStore reads it, renders the default language on
 * the server and during hydration, then switches to the remembered one without
 * a hydration mismatch. `<html lang>` follows the active language.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeToLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({ locale, t: createTranslator(getDictionary(locale)), setLocale: setStoredLocale }),
    [locale],
  );
  return <I18nContext value={value}>{children}</I18nContext>;
}

function useI18nContext(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useTranslations must be used inside <I18nProvider>.");
  return context;
}

/** Returns `t(key, values?)` for the active language. Client components only. */
export function useTranslations(): Translate {
  return useI18nContext().t;
}

/** Returns the active locale code. */
export function useLocale(): Locale {
  return useI18nContext().locale;
}

/** Returns a function that switches the interface language and remembers it on this device. */
export function useSetLocale(): (locale: Locale) => void {
  return useI18nContext().setLocale;
}
