import { describe, expect, it } from "vitest";

import { decideAccountLanguage, type AccountLanguageInput } from "./account-language";

function decide(overrides: Partial<AccountLanguageInput>) {
  return decideAccountLanguage({
    accountLanguage: "en",
    deviceLocale: "en",
    hasPendingChoice: false,
    deviceChoiceSave: "idle",
    ...overrides,
  });
}

describe("decideAccountLanguage without a pending choice", () => {
  it("changes nothing when the account and device agree", () => {
    expect(decide({})).toEqual({ kind: "none" });
  });

  it("lets the account's language win, e.g. on a new device", () => {
    expect(decide({ accountLanguage: "si", deviceLocale: "en" })).toEqual({
      kind: "apply-account",
      locale: "si",
    });
  });

  it("ignores an unsupported or missing account language", () => {
    expect(decide({ accountLanguage: "fr", deviceLocale: "si" })).toEqual({ kind: "none" });
    expect(decide({ accountLanguage: undefined, deviceLocale: "si" })).toEqual({ kind: "none" });
  });
});

describe("decideAccountLanguage with a pending choice", () => {
  it("keeps the device's language and saves it when it differs", () => {
    expect(decide({ hasPendingChoice: true, accountLanguage: "en", deviceLocale: "si" })).toEqual({
      kind: "save-device",
      locale: "si",
    });
  });

  it("only clears the mark when the account already has it", () => {
    expect(decide({ hasPendingChoice: true, accountLanguage: "si", deviceLocale: "si" })).toEqual({
      kind: "clear-pending",
    });
  });

  it("waits while the save runs, though the cache already shows the new language", () => {
    expect(
      decide({
        hasPendingChoice: true,
        accountLanguage: "si",
        deviceLocale: "si",
        deviceChoiceSave: "saving",
      }),
    ).toEqual({ kind: "none" });
  });

  it("keeps the device's language after a failed save rolled the account back", () => {
    // The mark survives the failure; on the next page load (save "idle") the
    // first test's case applies and the save is tried again.
    expect(
      decide({
        hasPendingChoice: true,
        accountLanguage: "en",
        deviceLocale: "si",
        deviceChoiceSave: "failed",
      }),
    ).toEqual({ kind: "none" });
  });
});
