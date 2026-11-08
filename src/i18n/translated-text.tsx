"use client";

import { useTranslations } from "./i18n-provider";
import type { TranslationKey, TranslationValues } from "./translate";

/**
 * A translated string for server components. Server components only know the
 * default language, so they render this small client component instead of
 * calling `t()` themselves; the text then follows a language switch at once.
 */
export function TranslatedText({ id, values }: { id: TranslationKey; values?: TranslationValues }) {
  const t = useTranslations();
  return t(id, values);
}
