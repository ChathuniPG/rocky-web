import { describe, expect, it } from "vitest";

import {
  hasPendingLocaleChoice,
  LOCALE_STORAGE_KEY,
  parseLocale,
  PENDING_LOCALE_CHOICE_KEY,
  readStoredLocale,
  writePendingLocaleChoice,
  writeStoredLocale,
  type LocaleStorage,
} from "./locale-storage";

function fakeStorage(initial: Record<string, string> = {}): LocaleStorage & {
  values: Record<string, string>;
} {
  const values = { ...initial };
  return {
    values,
    getItem: (key) => values[key] ?? null,
    setItem: (key, value) => {
      values[key] = value;
    },
    removeItem: (key) => {
      delete values[key];
    },
  };
}

const blockedStorage: LocaleStorage = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

describe("parseLocale", () => {
  it("accepts the supported locales only", () => {
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("si")).toBe("si");
    expect(parseLocale("en-US")).toBeNull();
    expect(parseLocale("")).toBeNull();
    expect(parseLocale(null)).toBeNull();
    expect(parseLocale(42)).toBeNull();
  });
});

describe("readStoredLocale and writeStoredLocale", () => {
  it("round-trips the remembered locale", () => {
    const storage = fakeStorage();
    writeStoredLocale(storage, "si");
    expect(storage.values[LOCALE_STORAGE_KEY]).toBe("si");
    expect(readStoredLocale(storage)).toBe("si");
  });

  it("ignores an unsupported stored value", () => {
    expect(readStoredLocale(fakeStorage({ [LOCALE_STORAGE_KEY]: "fr" }))).toBeNull();
  });

  it("copes with missing or blocked storage", () => {
    expect(readStoredLocale(undefined)).toBeNull();
    expect(readStoredLocale(blockedStorage)).toBeNull();
    expect(() => writeStoredLocale(blockedStorage, "en")).not.toThrow();
  });
});

describe("pending locale choice", () => {
  it("is marked and cleared", () => {
    const storage = fakeStorage();
    expect(hasPendingLocaleChoice(storage)).toBe(false);
    writePendingLocaleChoice(storage, true);
    expect(storage.values[PENDING_LOCALE_CHOICE_KEY]).toBe("1");
    expect(hasPendingLocaleChoice(storage)).toBe(true);
    writePendingLocaleChoice(storage, false);
    expect(hasPendingLocaleChoice(storage)).toBe(false);
  });

  it("counts as not pending when storage is missing or blocked", () => {
    expect(hasPendingLocaleChoice(undefined)).toBe(false);
    expect(hasPendingLocaleChoice(blockedStorage)).toBe(false);
    expect(() => writePendingLocaleChoice(blockedStorage, true)).not.toThrow();
  });
});
