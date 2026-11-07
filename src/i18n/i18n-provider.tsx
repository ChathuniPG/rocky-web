"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { createTranslator, getDictionary, type Locale, type Translate } from "./translate";

type I18nContextValue = { locale: Locale; t: Translate };

const I18nContext = createContext<I18nContextValue | null>(null);

/** Provides the active language and its translator to client components. */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => ({ locale, t: createTranslator(getDictionary(locale)) }), [locale]);
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
