"use client";

import { RadioGroup } from "@/components/ui/radio-group";
import { useCurrentUser } from "@/features/auth/auth-provider";
import { useLocale, useSetLocale, useTranslations } from "@/i18n/i18n-provider";
import { clearPendingLocaleChoice, parseLocale } from "@/i18n/locale-storage";
import { locales } from "@/i18n/translate";

import { SettingOption } from "./setting-option";
import { SettingsSection, settingsHeadingId } from "./settings-section";
import { useUpdateSetting } from "./use-update-setting";

/**
 * Interface language, English or Sinhala (FR-SET-03). Saved to the account, so
 * it follows the user to other devices, and applied at once: the save updates
 * the cached user optimistically and AuthProvider applies the account's
 * language (use-account-language.ts), which also remembers it on this device.
 */
export function LanguageSetting() {
  const t = useTranslations();
  const locale = useLocale();
  const setLocale = useSetLocale();
  const user = useCurrentUser();
  const { mutate: updateSetting } = useUpdateSetting();

  function changeLanguage(value: string) {
    const next = parseLocale(value);
    if (!next) return;
    // A pick here is the newest deliberate choice: it replaces one made before
    // signing in whose save failed (design.md 7.3).
    clearPendingLocaleChoice();
    // Already saved (e.g. another tab switched only this device): nothing to send.
    if (next === user.language) setLocale(next);
    else updateSetting({ field: "language", value: next });
  }

  return (
    <SettingsSection
      id="language"
      title={t("settings.language.title")}
      description={t("settings.language.description")}
    >
      <RadioGroup
        aria-labelledby={settingsHeadingId("language")}
        value={locale}
        onValueChange={changeLanguage}
        className="sm:grid-cols-2"
      >
        {locales.map((option) => (
          <SettingOption key={option} groupId="language" value={option} lang={option}>
            {t(`languages.${option}`)}
          </SettingOption>
        ))}
      </RadioGroup>
    </SettingsSection>
  );
}
