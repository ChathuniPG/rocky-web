import { createTranslator, defaultLocale, getDictionary, type Translate } from "./translate";

/**
 * Translator for server components, always in the default language (English).
 * The interface language is chosen in the browser (FR-SET-03, see
 * locale-storage.ts), so visible text in server components uses
 * <TranslatedText /> instead and follows a switch at once. Use this only for
 * what has to be decided on the server, which today means page metadata.
 *
 * Known limitations, accepted for #14:
 * - Browser tab titles (metadata) stay in English. Translating them would mean
 *   reading the language from a cookie on every request, which makes each
 *   page dynamic under cacheComponents.
 * - Signed-out pages (/login, /signup) are prerendered in English, so a device
 *   set to Sinhala briefly shows English until the page hydrates. Signed-in
 *   pages show the loading skeleton until the user is known, so they don't.
 */
export function getTranslations(): Translate {
  return createTranslator(getDictionary(defaultLocale));
}
