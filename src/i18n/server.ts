import { createTranslator, defaultLocale, getDictionary, type Translate } from "./translate";

/**
 * Translator for server components. Uses the default locale for now. Once the
 * language switcher lands, the locale will come from the user's preference;
 * reading a cookie here will then need a Suspense boundary under cacheComponents.
 */
export function getTranslations(): Translate {
  return createTranslator(getDictionary(defaultLocale));
}
