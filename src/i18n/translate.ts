import en from "./dictionaries/en.json";
import si from "./dictionaries/si.json";

/** Supported interface languages (FR-SET-03). */
export const locales = ["en", "si"] as const;

/** An interface language code. */
export type Locale = (typeof locales)[number];

/** Language used until the user picks one, and the one the server renders. */
export const defaultLocale: Locale = "en";

/** Shape of a dictionary; English is the reference every other language must match. */
export type Dictionary = typeof en;

type LeafKeys<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends object
      ? LeafKeys<T[K], `${Prefix}${K}.`>
      : never;
}[keyof T & string];

/** Every dotted key in the English dictionary, e.g. `"nav.home"`. Unknown keys are type errors. */
export type TranslationKey = LeafKeys<Dictionary>;

/** Values substituted into `{placeholder}` tokens. */
export type TranslationValues = Record<string, string | number>;

/** Looks up a translated string and fills in its placeholders. */
export type Translate = (key: TranslationKey, values?: TranslationValues) => string;

// Typed as Dictionary so a missing Sinhala key fails the type check.
const sinhala: Dictionary = si;

const dictionaries: Record<Locale, Dictionary> = { en, si: sinhala };

/** Returns the dictionary for a locale. */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

function lookup(dictionary: Dictionary, key: TranslationKey): string {
  let node: unknown = dictionary;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return key;
    node = (node as Record<string, unknown>)[part];
  }
  // Falling back to the key makes a gap visible in the UI instead of rendering nothing.
  return typeof node === "string" ? node : key;
}

/**
 * Creates a translator for a dictionary. Pure, so server components and the
 * client context share the same lookup and interpolation.
 */
export function createTranslator(dictionary: Dictionary): Translate {
  return (key, values) => {
    const template = lookup(dictionary, key);
    if (!values) return template;
    return template.replace(/\{(\w+)\}/g, (token, name: string) => {
      const value = values[name];
      return value === undefined ? token : String(value);
    });
  };
}
