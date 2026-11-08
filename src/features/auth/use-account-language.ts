"use client";

import { useLayoutEffect, useRef } from "react";

import { useUpdateSetting } from "@/features/settings/use-update-setting";
import { useSetLocale } from "@/i18n/i18n-provider";
import {
  clearPendingLocaleChoice,
  getLocaleSnapshot,
  isLocaleChoicePending,
} from "@/i18n/locale-storage";

import { decideAccountLanguage, type DeviceChoiceSave } from "./account-language";

/**
 * Applies "the most recent deliberate choice wins" (FR-SET-03, design.md 7.3)
 * whenever the signed-in user's language is known or changes: a language
 * picked on /login or /signup is saved to the account, otherwise the account's
 * language is applied. A layout effect runs before the browser paints, so the
 * app never shows a frame in the losing language.
 *
 * The save takes the same optimistic path as Settings (useUpdateSetting), with
 * its error toast; after a failure the device keeps the chosen language. The
 * device language is read when the effect runs rather than as a dependency, so
 * a switch made in another tab doesn't trigger a decision here.
 */
export function useAccountLanguage(accountLanguage: string | undefined) {
  const setLocale = useSetLocale();
  const { mutate: updateSetting } = useUpdateSetting({ announceSuccess: false });
  // Kept across effect re-runs (StrictMode, Activity), so the save is sent once per page load.
  const deviceChoiceSaveRef = useRef<DeviceChoiceSave>("idle");

  useLayoutEffect(() => {
    const decision = decideAccountLanguage({
      accountLanguage,
      deviceLocale: getLocaleSnapshot(),
      hasPendingChoice: isLocaleChoicePending(),
      deviceChoiceSave: deviceChoiceSaveRef.current,
    });

    switch (decision.kind) {
      case "apply-account":
        setLocale(decision.locale);
        break;
      case "clear-pending":
        clearPendingLocaleChoice();
        break;
      case "save-device":
        deviceChoiceSaveRef.current = "saving";
        updateSetting(
          { field: "language", value: decision.locale },
          {
            onSuccess: () => {
              clearPendingLocaleChoice();
              deviceChoiceSaveRef.current = "idle";
            },
            onError: () => {
              deviceChoiceSaveRef.current = "failed";
            },
          },
        );
        break;
      case "none":
        break;
    }
  }, [accountLanguage, setLocale, updateSetting]);
}
