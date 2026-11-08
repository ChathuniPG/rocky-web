import { parseLocale } from "@/i18n/locale-storage";
import type { Locale } from "@/i18n/translate";

/*
 * Which language wins once the signed-in user is known (FR-SET-03,
 * design.md 7.3): the most recent deliberate choice.
 * - A language picked on /login or /signup is a pending device choice. If it
 *   differs from the account's language it is kept and saved to the account;
 *   if it matches, the pending mark is simply cleared.
 * - Without a pending choice, the account's language wins, so it follows the
 *   user to a new device.
 * - While that save runs, or after it failed, the device language stays. The
 *   pending mark is kept after a failure, so the next page load tries again.
 */

/** Progress of saving a pending device choice to the account, during this page load. */
export type DeviceChoiceSave = "idle" | "saving" | "failed";

/** What to do with the interface language. */
export type AccountLanguageDecision =
  /** Nothing to change. */
  | { kind: "none" }
  /** Switch the interface to the account's language. */
  | { kind: "apply-account"; locale: Locale }
  /** Keep the device's language and save it to the account. */
  | { kind: "save-device"; locale: Locale }
  /** The account already has the pending choice: clear the mark. */
  | { kind: "clear-pending" };

/** The inputs of {@link decideAccountLanguage}. */
export type AccountLanguageInput = {
  /** `language` of the signed-in user, as cached (it may be an optimistic value). */
  accountLanguage: string | undefined;
  /** The language the interface shows now. */
  deviceLocale: Locale;
  /** A language picked on a signed-out page hasn't been saved to the account yet. */
  hasPendingChoice: boolean;
  deviceChoiceSave: DeviceChoiceSave;
};

/** Decides whether the account's or the device's language wins; see the rule above. */
export function decideAccountLanguage({
  accountLanguage,
  deviceLocale,
  hasPendingChoice,
  deviceChoiceSave,
}: AccountLanguageInput): AccountLanguageDecision {
  const account = parseLocale(accountLanguage);
  if (!account) return { kind: "none" };

  if (hasPendingChoice) {
    // In flight, the cache already shows the device language optimistically;
    // after a failure it shows the account's again. Either way the device keeps
    // its language, and only a successful save clears the mark.
    if (deviceChoiceSave !== "idle") return { kind: "none" };
    return account === deviceLocale
      ? { kind: "clear-pending" }
      : { kind: "save-device", locale: deviceLocale };
  }

  return account === deviceLocale ? { kind: "none" } : { kind: "apply-account", locale: account };
}
