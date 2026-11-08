import { defaultLocale, locales, type Locale } from "./translate";

/*
 * The interface language remembered on this device (FR-SET-03). Kept in
 * localStorage so signed-out pages (login, sign-up) use the last language too.
 * A small external store, read by I18nProvider with useSyncExternalStore.
 *
 * The most recent deliberate choice wins (design.md 7.3): a language picked
 * with the menu on a signed-out page is marked as a pending device choice,
 * which is saved to the account after sign-in. Without one, the language saved
 * on the account wins. See account-language.ts.
 */

/** localStorage key holding the remembered locale. */
export const LOCALE_STORAGE_KEY = "rocky:locale";

/** localStorage key set while a language picked on a signed-out page isn't saved to the account yet. */
export const PENDING_LOCALE_CHOICE_KEY = "rocky:locale-pending";

/** The part of Storage used here; tests pass a fake. */
export type LocaleStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** The value as a supported locale, or null for anything else (e.g. "en-US", null). */
export function parseLocale(value: unknown): Locale | null {
  return typeof value === "string" && (locales as readonly string[]).includes(value)
    ? (value as Locale)
    : null;
}

/** The remembered locale, or null if none is stored or storage is blocked. */
export function readStoredLocale(storage: LocaleStorage | undefined): Locale | null {
  try {
    return parseLocale(storage?.getItem(LOCALE_STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

/** Remembers the locale; full or blocked storage only means it isn't remembered. */
export function writeStoredLocale(storage: LocaleStorage | undefined, locale: Locale): void {
  try {
    storage?.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // The language still applies to this page; it just won't survive a reload.
  }
}

/** Whether a language picked on a signed-out page still has to be saved to the account. */
export function hasPendingLocaleChoice(storage: LocaleStorage | undefined): boolean {
  try {
    return storage?.getItem(PENDING_LOCALE_CHOICE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Marks or clears the pending choice; blocked storage simply loses the mark. */
export function writePendingLocaleChoice(
  storage: LocaleStorage | undefined,
  pending: boolean,
): void {
  try {
    if (pending) storage?.setItem(PENDING_LOCALE_CHOICE_KEY, "1");
    else storage?.removeItem(PENDING_LOCALE_CHOICE_KEY);
  } catch {
    // Without the mark the account's language wins after sign-in, as before.
  }
}

function browserStorage(): LocaleStorage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

const listeners = new Set<() => void>();
// Falls back to memory when storage is blocked, so switching still works on this page.
let currentLocale: Locale | null = null;

function notify() {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
  if (event.key !== LOCALE_STORAGE_KEY) return;
  const next = parseLocale(event.newValue);
  if (next && next !== currentLocale) {
    currentLocale = next;
    notify();
  }
}

/** Subscribes to locale changes, including ones made in other tabs. */
export function subscribeToLocale(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/** The active locale in the browser: the remembered one, else the default. */
export function getLocaleSnapshot(): Locale {
  currentLocale ??= readStoredLocale(browserStorage()) ?? defaultLocale;
  return currentLocale;
}

/** Whether this device has a language choice still to save to the account. */
export function isLocaleChoicePending(): boolean {
  return hasPendingLocaleChoice(browserStorage());
}

/** Clears the pending choice once the account has it. */
export function clearPendingLocaleChoice(): void {
  writePendingLocaleChoice(browserStorage(), false);
}

/** What the server renders: always the default, as nothing on the server knows the device's choice. */
export function getServerLocaleSnapshot(): Locale {
  return defaultLocale;
}

/**
 * A language the user picked themselves on a signed-out page: switches to it
 * and marks it as pending, so it is saved to the account after sign-in.
 */
export function chooseLocaleOnDevice(locale: Locale): void {
  writePendingLocaleChoice(browserStorage(), true);
  setStoredLocale(locale);
}

/** Switches the interface language and remembers it on this device. */
export function setStoredLocale(locale: Locale): void {
  writeStoredLocale(browserStorage(), locale);
  if (locale === currentLocale) return;
  currentLocale = locale;
  notify();
}
